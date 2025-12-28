"""
Handlers for EventSeat module.
"""
from typing import List, Dict, Any
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
)
from app.application.ticketing.queries_event_seat import GetEventSeatsQuery
from app.shared.exceptions import BusinessRuleError, NotFoundError
from app.shared.enums import EventConfigurationTypeEnum, EventSeatStatusEnum
from app.infrastructure.shared.database.models import SectionModel
from app.shared.tenant_context import require_tenant_context
from app.shared.utils import generate_id
from sqlmodel import select


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

        # 2. Get all sections for names
        with self.session_factory() as session:
            statement = select(SectionModel).where(
                SectionModel.layout_id == event.layout_id,
                SectionModel.tenant_id == command.tenant_id,
                SectionModel.is_deleted == False
            )
            sections = session.exec(statement).all()
            section_map = {s.id: s.name for s in sections}

        # 3. Delete existing seats for this event (regenerate)
        await self.event_seat_repository.delete_by_event(command.tenant_id, command.event_id)

        # 4. Create new EventSeats
        event_seats = []
        for seat in seats:
            section_name = section_map.get(seat.section_id, "Unknown Section")
            event_seat = EventSeat(
                tenant_id=tenant_id,
                event_id=command.event_id,
                status=EventSeatStatusEnum.AVAILABLE,
                seat_id=seat.id,
                section_name=section_name,
                row_name=seat.row,
                seat_number=seat.seat_number,
                attributes=seat.attributes
            )
            event_seats.append(event_seat)

        # 5. Save event seats first
        saved_seats = await self.event_seat_repository.save_all(event_seats)
        
        # 6. Create tickets for all seats if generate_tickets is True
        if command.generate_tickets:
            tickets = []
            for saved_seat in saved_seats:
                # Generate ticket number
                ticket_number = f"TKT-{saved_seat.id[:8].upper()}"
                
                # Create ticket entity - AVAILABLE status means created and available for sale
                ticket = Ticket(
                    tenant_id=tenant_id,
                    event_id=command.event_id,
                    event_seat_id=saved_seat.id,
                    ticket_number=ticket_number,
                    status=TicketStatusEnum.AVAILABLE,  # Available for sale, not yet reserved
                    price=command.ticket_price,  # Ticket price
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
            
            # Generate ticket number
            ticket_number = f"TKT-{seat.id[:8].upper()}"
            
            # Create ticket entity - AVAILABLE status means created and available for sale
            ticket = Ticket(
                tenant_id=tenant_id,
                event_id=command.event_id,
                event_seat_id=seat.id,
                ticket_number=ticket_number,
                status=TicketStatusEnum.AVAILABLE,  # Available for sale, not yet reserved
                price=command.ticket_price,  # Ticket price
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
        
        # Create the event seat
        event_seat = EventSeat(
            tenant_id=tenant_id,
            event_id=command.event_id,
            status=EventSeatStatusEnum.AVAILABLE,
            seat_id=command.seat_id,
            section_name=command.section_name,
            row_name=command.row_name,
            seat_number=command.seat_number,
            broker_id=command.broker_id,
            attributes=command.attributes
        )
        
        # Save the event seat first
        saved_seat = await self.event_seat_repository.save(event_seat)
        
        # If create_ticket is True, create ticket and mark seat as sold
        if command.create_ticket:
            # Generate ticket number
            ticket_number = command.ticket_number or f"TKT-{saved_seat.id[:8].upper()}"
            
            # Create ticket entity - AVAILABLE status means created and available for sale
            ticket = Ticket(
                tenant_id=tenant_id,
                event_id=command.event_id,
                event_seat_id=saved_seat.id,
                ticket_number=ticket_number,
                status=TicketStatusEnum.AVAILABLE,  # Available for sale, not yet reserved
                price=command.ticket_price or 0.0,  # Ticket price
            )
            # Save ticket (seat already saved, no need to update)
            await self.ticket_repository.save(ticket)
        
        return saved_seat


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
