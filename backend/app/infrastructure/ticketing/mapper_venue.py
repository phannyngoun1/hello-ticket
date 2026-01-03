"""
Venue mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.ticketing.venue import Venue
from app.infrastructure.shared.database.models import VenueModel


class VenueMapper:
    """Mapper for Venue entity to VenueModel conversion"""
    
    @staticmethod
    def to_domain(model: VenueModel) -> Venue:
        """Convert database model to domain entity
        
        Args:
            model: VenueModel from database
            
        Returns:
            Venue domain entity
        """
        # Handle fields gracefully in case columns don't exist yet
        image_url = getattr(model, 'image_url', None)
        description = getattr(model, 'description', None)
        venue_type = getattr(model, 'venue_type', None)
        capacity = getattr(model, 'capacity', None)
        parking_info = getattr(model, 'parking_info', None)
        accessibility = getattr(model, 'accessibility', None)
        amenities = getattr(model, 'amenities', None)
        opening_hours = getattr(model, 'opening_hours', None)
        phone = getattr(model, 'phone', None)
        email = getattr(model, 'email', None)
        website = getattr(model, 'website', None)
        street_address = getattr(model, 'street_address', None)
        city = getattr(model, 'city', None)
        state_province = getattr(model, 'state_province', None)
        postal_code = getattr(model, 'postal_code', None)
        country = getattr(model, 'country', None)
        return Venue(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            venue_id=model.id,
            description=description,
            image_url=image_url,
            venue_type=venue_type,
            capacity=capacity,
            parking_info=parking_info,
            accessibility=accessibility,
            amenities=amenities or [],
            opening_hours=opening_hours,
            phone=phone,
            email=email,
            website=website,
            street_address=street_address,
            city=city,
            state_province=state_province,
            postal_code=postal_code,
            country=country,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    @staticmethod
    def to_model(venue: Venue) -> VenueModel:
        """Convert domain entity to database model
        
        Args:
            venue: Venue domain entity
            
        Returns:
            VenueModel for database persistence
        """
        return VenueModel(
            id=venue.id,
            tenant_id=venue.tenant_id,
            code=venue.code,
            name=venue.name,
            description=getattr(venue, 'description', None),
            image_url=venue.image_url,
            venue_type=venue.venue_type,
            capacity=venue.capacity,
            parking_info=venue.parking_info,
            accessibility=venue.accessibility,
            amenities=venue.amenities,
            opening_hours=venue.opening_hours,
            phone=getattr(venue, 'phone', None),
            email=getattr(venue, 'email', None),
            website=getattr(venue, 'website', None),
            street_address=getattr(venue, 'street_address', None),
            city=getattr(venue, 'city', None),
            state_province=getattr(venue, 'state_province', None),
            postal_code=getattr(venue, 'postal_code', None),
            country=getattr(venue, 'country', None),
            is_active=venue.is_active,
            version=venue.get_version(),
            created_at=venue.created_at,
            updated_at=venue.updated_at,
        )

