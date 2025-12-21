"""Mapper between Seat domain entity and SeatModel database model."""
from app.domain.ticketing.seat import Seat, SeatType
from app.infrastructure.shared.database.models import SeatModel


class SeatMapper:
    """Maps between Seat domain entity and SeatModel database model"""

    def to_model(self, seat: Seat) -> SeatModel:
        """Convert domain entity to database model"""
        return SeatModel(
            id=seat.id,
            tenant_id=seat.tenant_id,
            venue_id=seat.venue_id,
            layout_id=seat.layout_id,
            section=seat.section,
            row=seat.row,
            seat_number=seat.seat_number,
            seat_type=seat.seat_type.value,
            x_coordinate=seat.x_coordinate,
            y_coordinate=seat.y_coordinate,
            is_active=seat.is_active,
            is_deleted=False,
            version=seat.get_version(),
            attributes=seat.attributes,
            created_at=seat.created_at,
            updated_at=seat.updated_at,
            deleted_at=None,
        )

    def to_domain(self, model: SeatModel) -> Seat:
        """Convert database model to domain entity"""
        return Seat(
            seat_id=model.id,
            tenant_id=model.tenant_id,
            venue_id=model.venue_id,
            layout_id=model.layout_id,
            section=model.section,
            row=model.row,
            seat_number=model.seat_number,
            seat_type=SeatType(model.seat_type),
            x_coordinate=model.x_coordinate,
            y_coordinate=model.y_coordinate,
            is_active=model.is_active,
            attributes=model.attributes or {},
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
