"""
API Mapper for EventSeat module.
"""
from typing import Optional
from app.domain.ticketing.event_seat import EventSeat
from app.presentation.api.ticketing.schemas_event_seat import EventSeatResponse


class EventSeatApiMapper:
    """Mapper to convert between domain objects and API schemas"""

    @staticmethod
    def to_response(
        seat: EventSeat, 
        ticket_number: Optional[str] = None, 
        ticket_price: Optional[float] = None
    ) -> EventSeatResponse:
        """Convert domain EventSeat to EventSeatResponse schema"""
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
            ticket_price=ticket_price
        )
