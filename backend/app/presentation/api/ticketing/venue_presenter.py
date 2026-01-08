"""Venue presenter for Ticketing API"""
from app.domain.ticketing.venue import Venue
from app.presentation.api.ticketing.schemas_venue import VenueResponse
from app.presentation.api.shared.presenter import BasePresenter


class VenuePresenter(BasePresenter[Venue, VenueResponse]):
    """Presenter for converting Venue domain entities to API responses"""

    def to_response(self, venue: Venue) -> VenueResponse:
        return VenueResponse(
            id=venue.id,
            tenant_id=venue.tenant_id,
            code=venue.code,
            name=venue.name,
            description=getattr(venue, 'description', None),
            image_url=venue.image_url,
            venue_type=getattr(venue, 'venue_type', None),
            capacity=getattr(venue, 'capacity', None),
            parking_info=getattr(venue, 'parking_info', None),
            accessibility=getattr(venue, 'accessibility', None),
            amenities=getattr(venue, 'amenities', None),
            opening_hours=getattr(venue, 'opening_hours', None),
            phone=getattr(venue, 'phone', None),
            email=getattr(venue, 'email', None),
            website=getattr(venue, 'website', None),
            street_address=getattr(venue, 'street_address', None),
            city=getattr(venue, 'city', None),
            state_province=getattr(venue, 'state_province', None),
            postal_code=getattr(venue, 'postal_code', None),
            country=getattr(venue, 'country', None),
            is_active=venue.is_active,
            created_at=venue.created_at,
            updated_at=venue.updated_at,
            deactivated_at=venue.deactivated_at,
        )
