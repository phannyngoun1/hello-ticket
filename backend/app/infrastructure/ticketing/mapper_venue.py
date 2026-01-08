"""
Venue mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.ticketing.venue import Venue
from app.infrastructure.shared.database.models import VenueModel
from app.infrastructure.shared.mapper import BaseMapper
from app.domain.shared.value_objects.address import Address
from app.domain.shared.value_objects.contact_info import ContactInfo


class VenueMapper(BaseMapper[Venue, VenueModel]):
    """Mapper for Venue entity to VenueModel conversion"""
    
    def to_domain(self, model: VenueModel) -> Optional[Venue]:
        """Convert database model to domain entity
        
        Args:
            model: VenueModel from database
            
        Returns:
            Venue domain entity
        """
        if not model:
            return None
        # Handle fields gracefully in case columns don't exist yet
        image_url = getattr(model, 'image_url', None)
        description = getattr(model, 'description', None)
        venue_type = getattr(model, 'venue_type', None)
        capacity = getattr(model, 'capacity', None)
        parking_info = getattr(model, 'parking_info', None)
        accessibility = getattr(model, 'accessibility', None)
        amenities = getattr(model, 'amenities', None)
        opening_hours = getattr(model, 'opening_hours', None)
        
        # Instantiate Value Objects from flat model fields
        contact_info = ContactInfo(
            email=getattr(model, 'email', None),
            phone=getattr(model, 'phone', None),
            website=getattr(model, 'website', None)
        )
        
        address = Address(
            street_address=getattr(model, 'street_address', None),
            city=getattr(model, 'city', None),
            state_province=getattr(model, 'state_province', None),
            postal_code=getattr(model, 'postal_code', None),
            country=getattr(model, 'country', None)
        )

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
            
            # Pass VOs
            contact_info=contact_info,
            address=address,
            
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    def to_model(self, venue: Venue) -> Optional[VenueModel]:
        """Convert domain entity to database model
        
        Args:
            venue: Venue domain entity
            
        Returns:
            VenueModel for database persistence
        """
        if not venue:
            return None
            
        # Flatten VOs to model fields
        email = venue.contact_info.email if venue.contact_info else None
        phone = venue.contact_info.phone if venue.contact_info else None
        website = venue.contact_info.website if venue.contact_info else None
        
        street_address = venue.address.street_address if venue.address else None
        city = venue.address.city if venue.address else None
        state_province = venue.address.state_province if venue.address else None
        postal_code = venue.address.postal_code if venue.address else None
        country = venue.address.country if venue.address else None

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
            
            # Flattened fields
            email=email,
            phone=phone,
            website=website,
            street_address=street_address,
            city=city,
            state_province=state_province,
            postal_code=postal_code,
            country=country,
            
            is_active=venue.is_active,
            version=venue.get_version(),
            created_at=venue.created_at,
            updated_at=venue.updated_at,
        )

