"""
API Mapper for EventSeat module.
"""
from datetime import datetime
from typing import Optional
from app.domain.ticketing.event_seat import EventSeat
from app.presentation.api.ticketing.schemas_event_seat import EventSeatResponse


class EventSeatApiMapper:
    """Mapper to convert between domain objects and API schemas"""

    @staticmethod
    def to_response(
        seat: EventSeat,
        ticket_number: Optional[str] = None,
        ticket_price: Optional[float] = None,
        ticket_status: Optional[str] = None,
        ticket_scanned_at: Optional[datetime] = None,
    ) -> EventSeatResponse:
        """Convert domain EventSeat to EventSeatResponse schema"""
        from app.shared.enums import TicketStatusEnum

        # Convert ticket_status string to enum if provided
        ticket_status_enum = None
        if ticket_status:
            try:
                ticket_status_enum = TicketStatusEnum(ticket_status)
            except (ValueError, TypeError):
                pass

        return EventSeatResponse(
            id=seat.id,
            tenant_id=seat.tenant_id,
            event_id=seat.event_id,
            status=seat.status,
            seat_id=seat.seat_id,
            section_name=seat.section_name,
            row_name=seat.row_name,
            seat_number=seat.seat_number,
            broker_id=seat.broker_id,
            attributes=seat.attributes,
            created_at=seat.created_at,
            updated_at=seat.updated_at,
            ticket_number=ticket_number,
            ticket_price=ticket_price,
            ticket_status=ticket_status_enum,
            ticket_scanned_at=ticket_scanned_at,
        )
