"""Mapper between Seat domain entity and SeatModel database model."""
from typing import Optional
from app.domain.ticketing.seat import Seat, SeatType
from app.infrastructure.shared.database.models import SeatModel
from app.infrastructure.shared.mapper import BaseMapper


class SeatMapper(BaseMapper[Seat, SeatModel]):
    """Maps between Seat domain entity and SeatModel database model"""

    def to_model(self, seat: Seat) -> Optional[SeatModel]:
        """Convert domain entity to database model"""
        if not seat:
            return None
        return SeatModel(
            id=seat.id,
            tenant_id=seat.tenant_id,
            venue_id=seat.venue_id,
            layout_id=seat.layout_id,
            section_id=seat.section_id,
            row=seat.row,
            seat_number=seat.seat_number,
            seat_type=seat.seat_type.value,
            x_coordinate=seat.x_coordinate,
            y_coordinate=seat.y_coordinate,
            shape=getattr(seat, 'shape', None),  # PlacementShape data as dict
            is_active=seat.is_active,
            is_deleted=False,
            version=seat.get_version(),
            attributes=seat.attributes,
            created_at=seat.created_at,
            updated_at=seat.updated_at,
            deleted_at=None,
        )

    def to_domain(self, model: SeatModel) -> Optional[Seat]:
        """Convert database model to domain entity"""
        if not model:
            return None
        # Get shape from model - it's stored as JSONB (dict) in the database
        shape = None
        if hasattr(model, 'shape') and model.shape is not None:
            shape = model.shape  # Already a dict from JSONB
        return Seat(
            seat_id=model.id,
            tenant_id=model.tenant_id,
            venue_id=model.venue_id,
            layout_id=model.layout_id,
            section_id=model.section_id,
            row=model.row,
            seat_number=model.seat_number,
            seat_type=SeatType(model.seat_type),
            x_coordinate=model.x_coordinate,
            y_coordinate=model.y_coordinate,
            shape=shape,  # PlacementShape data as dict
            is_active=model.is_active,
            attributes=model.attributes or {},
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
