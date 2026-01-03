"""API mapper for Ticketing module"""
from app.domain.ticketing.venue_type import VenueType
from app.presentation.api.ticketing.schemas_venue_type import VenueTypeResponse


class TicketingApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def venue_type_to_response(venue_type: VenueType) -> VenueTypeResponse:
        return VenueTypeResponse(
            id=venue_type.id,
            tenant_id=venue_type.tenant_id,
            code=venue_type.code,
            name=venue_type.name,

            is_active=venue_type.is_active,
            created_at=venue_type.created_at,
            updated_at=venue_type.updated_at,
        )

