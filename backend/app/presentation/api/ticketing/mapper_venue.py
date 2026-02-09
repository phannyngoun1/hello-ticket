"""API mapper for Ticketing module"""
import json
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
            description=venue.description,
            image_url=venue.image_url,
            venue_type=venue.venue_type,
            capacity=venue.capacity,
            parking_info=venue.parking_info,
            accessibility=venue.accessibility,
            amenities=venue.amenities,
            opening_hours=venue.opening_hours,
            # Extract from Value Objects
            phone=venue.contact_info.phone if venue.contact_info else None,
            email=venue.contact_info.email if venue.contact_info else None,
            website=venue.contact_info.website if venue.contact_info else None,
            street_address=venue.address.street_address if venue.address else None,
            city=venue.address.city if venue.address else None,
            state_province=venue.address.state_province if venue.address else None,
            postal_code=venue.address.postal_code if venue.address else None,
            country=venue.address.country if venue.address else None,
            is_active=venue.is_active,
            created_at=venue.created_at,
            updated_at=venue.updated_at,
            deactivated_at=venue.deactivated_at,
        )

    @staticmethod
    def seat_to_response(seat: Seat) -> SeatResponse:
        # Convert shape dict to JSON string for API response
        # Always include shape field, even if None, so frontend knows it exists
        shape_str = None
        if hasattr(seat, 'shape') and seat.shape is not None:
            if isinstance(seat.shape, dict):
                shape_str = json.dumps(seat.shape)
            elif isinstance(seat.shape, str):
                shape_str = seat.shape
            else:
                shape_str = json.dumps(seat.shape)
        # If shape is None, shape_str will be None, which Pydantic will serialize as null
        
        return SeatResponse(
            id=seat.id,
            tenant_id=seat.tenant_id,
            venue_id=seat.venue_id,
            layout_id=seat.layout_id,
            section_id=seat.section_id,
            row=seat.row,
            seat_number=seat.seat_number,
            seat_type=seat.seat_type,
            x_coordinate=seat.x_coordinate,
            y_coordinate=seat.y_coordinate,
            shape=shape_str,  # Will be None if no shape, which serializes to null in JSON
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
            design_mode=layout.design_mode,
            canvas_background_color=layout.canvas_background_color or "#e5e7eb",
            is_active=layout.is_active,
            created_at=layout.created_at,
            updated_at=layout.updated_at,
        )

