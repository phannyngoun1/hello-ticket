"""EventSeat mapper for Ticketing - Translates between domain and database models."""
from app.domain.ticketing.event_seat import EventSeat
from app.infrastructure.shared.database.models import EventSeatModel
from app.shared.enums import EventSeatStatusEnum


class EventSeatMapper:
    """Mapper for translating between EventSeat domain and database models"""

    @staticmethod
    def to_domain(model: EventSeatModel) -> EventSeat:
        """Convert database model to domain aggregate"""
        return EventSeat(
            tenant_id=model.tenant_id,
            event_id=model.event_id,
            status=EventSeatStatusEnum(model.status),
            seat_id=model.seat_id,
            section_name=model.section_name,
            row_name=model.row_name,
            seat_number=model.seat_number,
            price=model.price,
            ticket_code=model.ticket_code,
            broker_id=model.broker_id,
            event_seat_id=model.id,
            is_active=model.is_active,
            attributes=model.attributes,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )

    @staticmethod
    def to_model(domain: EventSeat) -> EventSeatModel:
        """Convert domain aggregate to database model"""
        return EventSeatModel(
            id=domain.id,
            tenant_id=domain.tenant_id,
            event_id=domain.event_id,
            seat_id=domain.seat_id,
            status=domain.status.value,
            section_name=domain.section_name,
            row_name=domain.row_name,
            seat_number=domain.seat_number,
            price=domain.price,
            ticket_code=domain.ticket_code,
            broker_id=domain.broker_id,
            is_active=domain.is_active,
            version=domain.version,
            attributes=domain.attributes,
            created_at=domain.created_at,
            updated_at=domain.updated_at,
        )
