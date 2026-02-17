"""
Handlers for EventSeat module.
"""
from typing import List, Dict, Any
from dataclasses import dataclass
from app.domain.ticketing.event_repositories import EventRepository
from app.domain.ticketing.seat_repositories import SeatRepository
from app.domain.ticketing.event_seat import EventSeat
from app.domain.ticketing.event_seat_repositories import EventSeatRepository, EventSeatSearchResult
from app.domain.ticketing.ticket import Ticket
from app.domain.ticketing.ticket_repositories import TicketRepository
from app.shared.enums import TicketStatusEnum
from app.application.ticketing.commands_event_seat import (
    InitializeEventSeatsCommand,
    ImportBrokerSeatsCommand,
    DeleteEventSeatsCommand,
    CreateTicketsFromSeatsCommand,
    CreateEventSeatCommand,
    HoldEventSeatsCommand,
    UnholdEventSeatsCommand,
    UnblockEventSeatsCommand,
    BlockEventSeatsCommand,
)
from app.application.ticketing.queries_event_seat import GetEventSeatsQuery, GetEventSeatStatisticsQuery
from app.shared.exceptions import BusinessRuleError, NotFoundError
from app.shared.enums import EventConfigurationTypeEnum, EventSeatStatusEnum, EventStatusEnum
from app.infrastructure.shared.database.models import SectionModel
from app.shared.tenant_context import require_tenant_context
from app.shared.utils import generate_id
from sqlmodel import select, func


@dataclass
class EventSeatStatistics:
    """Statistics for event seats"""
    total_seats: int
    available_seats: int
    reserved_seats: int
    sold_seats: int
    held_seats: int
    blocked_seats: int


class EventSeatCommandHandler:
    """Handler for EventSeat commands"""

    def __init__(
        self,
        event_repository: EventRepository,
        seat_repository: SeatRepository,
        event_seat_repository: EventSeatRepository,
        ticket_repository: TicketRepository,
        session_factory: Any  # Needed for direct SectionModel access
    ):
        self.event_repository = event_repository
        self.seat_repository = seat_repository
        self.event_seat_repository = event_seat_repository
        self.ticket_repository = ticket_repository
        self.session_factory = session_factory

    async def handle_initialize_event_seats(self, command: InitializeEventSeatsCommand) -> List[EventSeat]:
        """Generate EventSeat records from Layout seats"""
        tenant_id = require_tenant_context()
        event = await self.event_repository.get_by_id(tenant_id, command.event_id)
        if not event:
            raise NotFoundError(f"Event {command.event_id} not found")
        
        if event.configuration_type != EventConfigurationTypeEnum.SEAT_SETUP:
            raise BusinessRuleError("Event is not configured for SEAT_SETUP")
        
        if not event.layout_id:
            raise BusinessRuleError("Event has no layout assigned")

        # 1. Get all seats for the layout
        seats = await self.seat_repository.get_all_by_layout(command.tenant_id, event.layout_id)
        if not seats:
            return []

        # 2. Get all sections for names and pricing
        with self.session_factory() as session:
            statement = select(SectionModel).where(
                SectionModel.layout_id == event.layout_id,
                SectionModel.tenant_id == command.tenant_id,
                SectionModel.is_deleted == False
            )
            sections = session.exec(statement).all()
            section_map = {s.id: s.name for s in sections}
            section_id_set = {s.id for s in sections}

        # 3. Build section pricing map if per-section pricing is enabled
        section_pricing_map = {}
        if command.pricing_mode == "per_section" and command.section_pricing:
            for sp in command.section_pricing:
                section_pricing_map[sp.section_id] = sp.price

        # Build seat pricing map for individual seat overrides
        seat_pricing_map = {}
        if command.seat_pricing:
            for sp in command.seat_pricing:
                seat_pricing_map[sp.seat_id] = sp.price

        # 4. Filter seats based on included/excluded section IDs
        filtered_seats = []
        included_set = set(command.included_section_ids) if command.included_section_ids else None
        excluded_set = set(command.excluded_section_ids) if command.excluded_section_ids else None
        
        for seat in seats:
            # Skip if section is not in included list (when provided)
            if included_set is not None and seat.section_id not in included_set:
                continue
            # Skip if section is in excluded list
            if excluded_set is not None and seat.section_id in excluded_set:
                continue
            filtered_seats.append(seat)

        if not filtered_seats:
            return []

        # 5. Get existing event seats for this event to avoid duplicates
        existing_seats_result = await self.event_seat_repository.get_by_event(
            tenant_id=command.tenant_id,
            event_id=command.event_id,
            skip=0,
            limit=10000  # Get all existing seats
        )
        existing_seats = existing_seats_result.items
        
        # Create lookup maps for existing seats
        existing_by_seat_id = {}  # Map seat_id -> EventSeat
        existing_by_location = {}  # Map (section_name, row_name, seat_number) -> EventSeat
        for existing_seat in existing_seats:
            if existing_seat.seat_id:
                existing_by_seat_id[existing_seat.seat_id] = existing_seat
            if existing_seat.section_name and existing_seat.row_name and existing_seat.seat_number:
                location_key = (existing_seat.section_name, existing_seat.row_name, existing_seat.seat_number)
                existing_by_location[location_key] = existing_seat

        # 6. Create new EventSeats only for seats that don't exist
        new_event_seats = []
        for seat in filtered_seats:
            section_name = section_map.get(seat.section_id, "Unknown Section")
            
            # Check if event seat already exists (by seat_id or by location)
            existing_seat = None
            if seat.id and seat.id in existing_by_seat_id:
                existing_seat = existing_by_seat_id[seat.id]
            else:
                location_key = (section_name, seat.row, seat.seat_number)
                if location_key in existing_by_location:
                    existing_seat = existing_by_location[location_key]
            
            # Skip if seat already exists
            if existing_seat:
                continue
            
            # Determine price for this seat based on pricing mode and overrides
            seat_price = command.ticket_price  # Default price
            
            # Check for individual seat price override first
            if seat.id in seat_pricing_map:
                seat_price = seat_pricing_map[seat.id]
            elif command.pricing_mode == "per_section":
                # Get section_id and check section pricing
                if seat.section_id in section_pricing_map:
                    seat_price = section_pricing_map[seat.section_id]
            
            event_seat = EventSeat(
                tenant_id=tenant_id,
                event_id=command.event_id,
                status=EventSeatStatusEnum.AVAILABLE,
                seat_id=seat.id,
                section_name=section_name,
                row_name=seat.row,
                seat_number=seat.seat_number,
                price=seat_price,  # Store price on EventSeat
                attributes=seat.attributes
            )
            new_event_seats.append(event_seat)

        # 7. Save new event seats only
        saved_seats = []
        if new_event_seats:
            saved_seats = await self.event_seat_repository.save_all(new_event_seats)
        
        # 8. Create tickets for new seats if generate_tickets is True
        if command.generate_tickets and saved_seats:
            tickets = []
            for saved_seat in saved_seats:
                # Check if ticket already exists for this event seat
                existing_ticket = await self.ticket_repository.get_by_event_seat(
                    tenant_id=tenant_id,
                    event_seat_id=saved_seat.id
                )
                
                # Skip if ticket already exists
                if existing_ticket:
                    continue
                
                # Use the price stored on the EventSeat
                ticket_price = saved_seat.price
                
                # Generate ticket number
                ticket_number = f"TKT-{saved_seat.id[:8].upper()}"
                
                # Create ticket entity - AVAILABLE status means created and available for sale
                ticket = Ticket(
                    tenant_id=tenant_id,
                    event_id=command.event_id,
                    event_seat_id=saved_seat.id,
                    ticket_number=ticket_number,
                    status=TicketStatusEnum.AVAILABLE,  # Available for sale, not yet reserved
                    price=ticket_price,  # Use price from EventSeat
                )
                tickets.append(ticket)
                
                # Seat remains AVAILABLE (has ticket but available for sale)
                # No need to change seat status - it stays AVAILABLE
            
            # Save tickets (seats already saved, no need to update)
            if tickets:
                await self.ticket_repository.save_all(tickets)
        
        return saved_seats

    async def handle_import_broker_seats(self, command: ImportBrokerSeatsCommand) -> List[EventSeat]:
        """Import seats from broker list"""
        tenant_id = require_tenant_context()
        event = await self.event_repository.get_by_id(tenant_id, command.event_id)
        if not event:
            raise NotFoundError(f"Event {command.event_id} not found")
        
        if event.configuration_type != EventConfigurationTypeEnum.TICKET_IMPORT:
            raise BusinessRuleError("Event is not configured for TICKET_IMPORT")

        event_seats = []
        for item in command.seats:
            event_seat = EventSeat(
                tenant_id=command.tenant_id,
                event_id=command.event_id,
                status=EventSeatStatusEnum.AVAILABLE,
                section_name=item.section_name,
                row_name=item.row_name,
                seat_number=item.seat_number,
                broker_id=command.broker_id,
                attributes=item.attributes
            )
            event_seats.append(event_seat)

        return await self.event_seat_repository.save_all(event_seats)

    async def handle_delete_event_seats(self, command: DeleteEventSeatsCommand) -> int:
        """Delete specific event seats by their IDs"""
        tenant_id = require_tenant_context()
        event = await self.event_repository.get_by_id(tenant_id, command.event_id)
        if not event:
            raise NotFoundError(f"Event {command.event_id} not found")
        
        if not command.event_seat_ids:
            return 0
        
        deleted_count = await self.event_seat_repository.delete(
            tenant_id=command.tenant_id,
            event_id=command.event_id,
            event_seat_ids=command.event_seat_ids
        )
        
        return deleted_count

    async def handle_create_tickets_from_seats(self, command: CreateTicketsFromSeatsCommand) -> List[EventSeat]:
        """Create tickets from event seats (create Ticket entities and mark seats as sold)"""
        tenant_id = require_tenant_context()
        event = await self.event_repository.get_by_id(tenant_id, command.event_id)
        if not event:
            raise NotFoundError(f"Event {command.event_id} not found")

        # Validate that event is in ON_SALE status for ticket creation
        if event.status != EventStatusEnum.ON_SALE:
            raise BusinessRuleError(f"Cannot create tickets for event {command.event_id} with status '{event.status}'. Tickets can only be created when event status is 'on_sale'.")

        if not command.event_seat_ids:
            return []
        
        # Get all event seats
        event_seats = []
        for seat_id in command.event_seat_ids:
            seat = await self.event_seat_repository.get_by_id(tenant_id, seat_id)
            if not seat:
                raise NotFoundError(f"Event seat {seat_id} not found")
            if seat.event_id != command.event_id:
                raise BusinessRuleError(f"Event seat {seat_id} does not belong to event {command.event_id}")
            event_seats.append(seat)
        
        # Create tickets and mark seats as sold
        updated_seats = []
        tickets = []
        for seat in event_seats:
            # Skip if already sold
            if seat.status == EventSeatStatusEnum.SOLD:
                updated_seats.append(seat)
                continue
            
            # Use price from EventSeat, fallback to command price if seat price is 0
            ticket_price = seat.price if seat.price > 0 else command.ticket_price
            
            # Generate ticket number
            ticket_number = f"TKT-{seat.id[:8].upper()}"
            
            # Create ticket entity - AVAILABLE status means created and available for sale
            ticket = Ticket(
                tenant_id=tenant_id,
                event_id=command.event_id,
                event_seat_id=seat.id,
                ticket_number=ticket_number,
                status=TicketStatusEnum.AVAILABLE,  # Available for sale, not yet reserved
                price=ticket_price,  # Use price from EventSeat
            )
            tickets.append(ticket)
            
            # Seat remains AVAILABLE (has ticket but available for sale)
            # No need to change seat status - it stays AVAILABLE
            updated_seats.append(seat)
        
        # Save tickets and seats
        if tickets:
            await self.ticket_repository.save_all(tickets)
        return await self.event_seat_repository.save_all(updated_seats)

    async def handle_create_event_seat(self, command: CreateEventSeatCommand) -> EventSeat:
        """Create a single event seat, optionally creating a ticket immediately"""
        tenant_id = require_tenant_context()
        event = await self.event_repository.get_by_id(tenant_id, command.event_id)
        if not event:
            raise NotFoundError(f"Event {command.event_id} not found")
        
        # Validate that either seat_id or location info is provided
        if not command.seat_id and not (command.section_name and command.row_name and command.seat_number):
            raise BusinessRuleError("Either seat_id or (section_name, row_name, seat_number) must be provided")
        
        # Create the event seat with price
        event_seat = EventSeat(
            tenant_id=tenant_id,
            event_id=command.event_id,
            status=EventSeatStatusEnum.AVAILABLE,
            seat_id=command.seat_id,
            section_name=command.section_name,
            row_name=command.row_name,
            seat_number=command.seat_number,
            broker_id=command.broker_id,
            price=command.ticket_price or 0.0,  # Store price on EventSeat
            attributes=command.attributes
        )
        
        # Save the event seat first
        saved_seat = await self.event_seat_repository.save(event_seat)
        
        # If create_ticket is True, create ticket and mark seat as sold
        if command.create_ticket:
            # Generate ticket number
            ticket_number = command.ticket_number or f"TKT-{saved_seat.id[:8].upper()}"
            
            # Create ticket entity - AVAILABLE status means created and available for sale
            # Use price from EventSeat
            ticket = Ticket(
                tenant_id=tenant_id,
                event_id=command.event_id,
                event_seat_id=saved_seat.id,
                ticket_number=ticket_number,
                status=TicketStatusEnum.AVAILABLE,  # Available for sale, not yet reserved
                price=saved_seat.price,  # Use price from EventSeat
            )
            # Save ticket (seat already saved, no need to update)
            await self.ticket_repository.save(ticket)
        
        return saved_seat

    async def handle_hold_event_seats(self, command: HoldEventSeatsCommand) -> List[EventSeat]:
        """Hold multiple event seats with a reason"""
        tenant_id = require_tenant_context()
        event = await self.event_repository.get_by_id(tenant_id, command.event_id)
        if not event:
            raise NotFoundError(f"Event {command.event_id} not found")

        if not command.event_seat_ids:
            return []

        # Get all event seats to hold
        event_seats = []
        for seat_id in command.event_seat_ids:
            seat = await self.event_seat_repository.get_by_id(tenant_id, seat_id)
            if not seat:
                raise NotFoundError(f"Event seat {seat_id} not found")
            if seat.event_id != command.event_id:
                raise BusinessRuleError(f"Event seat {seat_id} does not belong to event {command.event_id}")
            event_seats.append(seat)

        # Hold each seat with reason
        for seat in event_seats:
            seat.hold(command.reason)

        # Save updated seats
        return await self.event_seat_repository.save_all(event_seats)

    async def handle_unhold_event_seats(self, command: UnholdEventSeatsCommand) -> List[EventSeat]:
        """Unhold multiple event seats"""
        tenant_id = require_tenant_context()
        event = await self.event_repository.get_by_id(tenant_id, command.event_id)
        if not event:
            raise NotFoundError(f"Event {command.event_id} not found")

        if not command.event_seat_ids:
            return []

        # Get all event seats to unhold
        event_seats = []
        for seat_id in command.event_seat_ids:
            seat = await self.event_seat_repository.get_by_id(tenant_id, seat_id)
            if not seat:
                raise NotFoundError(f"Event seat {seat_id} not found")
            if seat.event_id != command.event_id:
                raise BusinessRuleError(f"Event seat {seat_id} does not belong to event {command.event_id}")
            event_seats.append(seat)

        # Unhold each seat
        for seat in event_seats:
            seat.unhold()

        # Save updated seats
        return await self.event_seat_repository.save_all(event_seats)

    async def handle_unblock_event_seats(self, command: UnblockEventSeatsCommand) -> List[EventSeat]:
        """Unblock multiple event seats"""
        tenant_id = require_tenant_context()
        event = await self.event_repository.get_by_id(tenant_id, command.event_id)
        if not event:
            raise NotFoundError(f"Event {command.event_id} not found")

        if not command.event_seat_ids:
            return []

        # Get all event seats to unblock
        event_seats = []
        for seat_id in command.event_seat_ids:
            seat = await self.event_seat_repository.get_by_id(tenant_id, seat_id)
            if not seat:
                raise NotFoundError(f"Event seat {seat_id} not found")
            if seat.event_id != command.event_id:
                raise BusinessRuleError(f"Event seat {seat_id} does not belong to event {command.event_id}")
            event_seats.append(seat)

        # Unblock each seat
        for seat in event_seats:
            seat.unblock()

        # Save updated seats
        return await self.event_seat_repository.save_all(event_seats)

    async def handle_block_event_seats(self, command: BlockEventSeatsCommand) -> List[EventSeat]:
        """Block multiple event seats with a reason"""
        tenant_id = require_tenant_context()
        event = await self.event_repository.get_by_id(tenant_id, command.event_id)
        if not event:
            raise NotFoundError(f"Event {command.event_id} not found")

        if not command.event_seat_ids:
            return []

        # Get all event seats to block
        event_seats = []
        for seat_id in command.event_seat_ids:
            seat = await self.event_seat_repository.get_by_id(tenant_id, seat_id)
            if not seat:
                raise NotFoundError(f"Event seat {seat_id} not found")
            if seat.event_id != command.event_id:
                raise BusinessRuleError(f"Event seat {seat_id} does not belong to event {command.event_id}")
            event_seats.append(seat)

        # Block each seat with reason
        for seat in event_seats:
            seat.block(command.reason)

        # Save updated seats
        return await self.event_seat_repository.save_all(event_seats)


class EventSeatQueryHandler:
    """Handler for EventSeat queries"""

    def __init__(self, event_seat_repository: EventSeatRepository):
        self.event_seat_repository = event_seat_repository

    async def handle_get_event_seats(self, query: GetEventSeatsQuery) -> EventSeatSearchResult:
        """Get seats for an event"""
        tenant_id = require_tenant_context()
        return await self.event_seat_repository.get_by_event(
            tenant_id=tenant_id,
            event_id=query.event_id,
            skip=query.skip,
            limit=query.limit
        )

    async def handle_get_event_seat_statistics(self, query: GetEventSeatStatisticsQuery) -> EventSeatStatistics:
        """Get seat statistics for an event"""
        tenant_id = require_tenant_context()

        # Use the session factory to get direct database access for aggregation
        with self.event_seat_repository._session_factory() as session:
            from app.infrastructure.shared.database.models import EventSeatModel

            # Build base query
            base_query = select(EventSeatModel).where(
                EventSeatModel.tenant_id == tenant_id,
                EventSeatModel.event_id == query.event_id,
                EventSeatModel.is_deleted == False
            )
            # Get total count
            total_result = session.exec(select(func.count()).select_from(base_query.subquery())).first()
            total_seats = total_result or 0
            # Get counts by status
            subquery_alias = base_query.subquery().alias()
            staticstics_query = select(
                    subquery_alias.c.status,
                    func.count(subquery_alias.c.id)
                ).select_from(subquery_alias).group_by(subquery_alias.c.status)

            status_counts = session.exec(staticstics_query).all()
            # Initialize counts
            available_seats = 0
            reserved_seats = 0
            sold_seats = 0
            held_seats = 0
            blocked_seats = 0

            for status, count in status_counts:
                if status == EventSeatStatusEnum.AVAILABLE:
                    available_seats = count
                elif status == EventSeatStatusEnum.RESERVED:
                    reserved_seats = count
                elif status == EventSeatStatusEnum.SOLD:
                    sold_seats = count
                elif status == EventSeatStatusEnum.HELD:
                    held_seats = count
                elif status == EventSeatStatusEnum.BLOCKED:
                    blocked_seats = count
                else:
                    pass  # Unhandled status - ignore

            return EventSeatStatistics(
                total_seats=total_seats,
                available_seats=available_seats,
                reserved_seats=reserved_seats,
                sold_seats=sold_seats,
                held_seats=held_seats,
                blocked_seats=blocked_seats
            )
