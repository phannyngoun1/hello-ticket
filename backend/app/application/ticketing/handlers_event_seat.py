"""
Handlers for EventSeat module.
"""
from typing import List, Dict, Any
from app.domain.ticketing.event_repositories import EventRepository
from app.domain.ticketing.seat_repositories import SeatRepository
from app.domain.ticketing.event_seat import EventSeat
from app.domain.ticketing.event_seat_repositories import EventSeatRepository, EventSeatSearchResult
from app.application.ticketing.commands_event_seat import InitializeEventSeatsCommand, ImportBrokerSeatsCommand
from app.application.ticketing.queries_event_seat import GetEventSeatsQuery
from app.shared.exceptions import BusinessRuleError, NotFoundError
from app.shared.enums import EventConfigurationTypeEnum, EventSeatStatusEnum
from app.infrastructure.shared.database.models import SectionModel
from app.shared.tenant_context import require_tenant_context
from sqlmodel import select


class EventSeatCommandHandler:
    """Handler for EventSeat commands"""

    def __init__(
        self,
        event_repository: EventRepository,
        seat_repository: SeatRepository,
        event_seat_repository: EventSeatRepository,
        session_factory: Any  # Needed for direct SectionModel access
    ):
        self.event_repository = event_repository
        self.seat_repository = seat_repository
        self.event_seat_repository = event_seat_repository
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

        # 5. Save all
        return await self.event_seat_repository.save_all(event_seats)

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
                price=item.price,
                ticket_code=item.ticket_code,
                broker_id=command.broker_id,
                attributes=item.attributes
            )
            event_seats.append(event_seat)

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
