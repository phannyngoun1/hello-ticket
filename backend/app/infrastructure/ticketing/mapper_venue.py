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
        # Handle image_url gracefully in case column doesn't exist yet
        image_url = getattr(model, 'image_url', None)
        return Venue(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            venue_id=model.id,
            image_url=image_url,
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
            image_url=venue.image_url,
            is_active=venue.is_active,
            version=venue.get_version(),
            created_at=venue.created_at,
            updated_at=venue.updated_at,
        )

