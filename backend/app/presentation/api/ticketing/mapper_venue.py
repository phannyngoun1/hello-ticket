"""API mapper for Ticketing module"""
from typing import Optional

from app.domain.ticketing.venue import Venue
from app.domain.ticketing.seat import Seat
from app.domain.ticketing.layout import Layout
from app.presentation.api.ticketing.schemas_venue import VenueResponse
from app.presentation.api.ticketing.schemas_seat import SeatResponse
from app.presentation.api.ticketing.schemas_layout import LayoutResponse


class TicketingApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def venue_to_response(venue: Venue) -> VenueResponse:
        return VenueResponse(
            id=venue.id,
            tenant_id=venue.tenant_id,
            code=venue.code,
            name=venue.name,
            image_url=venue.image_url,
            is_active=venue.is_active,
            created_at=venue.created_at,
            updated_at=venue.updated_at,
            deactivated_at=venue.deactivated_at,
        )

    @staticmethod
    def seat_to_response(seat: Seat) -> SeatResponse:
        return SeatResponse(
            id=seat.id,
            tenant_id=seat.tenant_id,
            venue_id=seat.venue_id,
            layout_id=seat.layout_id,
            section=seat.section,
            row=seat.row,
            seat_number=seat.seat_number,
            seat_type=seat.seat_type,
            x_coordinate=seat.x_coordinate,
            y_coordinate=seat.y_coordinate,
            is_active=seat.is_active,
            created_at=seat.created_at,
            updated_at=seat.updated_at,
        )

    @staticmethod
    def layout_to_response(layout: Layout, image_url: Optional[str] = None) -> LayoutResponse:
        return LayoutResponse(
            id=layout.id,
            tenant_id=layout.tenant_id,
            venue_id=layout.venue_id,
            name=layout.name,
            description=layout.description,
            file_id=layout.file_id,
            image_url=image_url,
            is_active=layout.is_active,
            created_at=layout.created_at,
            updated_at=layout.updated_at,
        )

