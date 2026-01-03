"""
VenueType mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.ticketing.venue_type import VenueType
from app.infrastructure.shared.database.models import VenueTypeModel


class VenueTypeMapper:
    """Mapper for VenueType entity to VenueTypeModel conversion"""
    
    @staticmethod
    def to_domain(model: VenueTypeModel) -> VenueType:
        """Convert database model to domain entity
        
        Args:
            model: VenueTypeModel from database
            
        Returns:
            VenueType domain entity
        """
        return VenueType(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            venue_type_id=model.id,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    @staticmethod
    def to_model(venue_type: VenueType) -> VenueTypeModel:
        """Convert domain entity to database model
        
        Args:
            venue_type: VenueType domain entity
            
        Returns:
            VenueTypeModel for database persistence
        """
        return VenueTypeModel(
            id=venue_type.id,
            tenant_id=venue_type.tenant_id,
            code=venue_type.code,
            name=venue_type.name,
            is_active=venue_type.is_active,
            version=venue_type.get_version(),
            created_at=venue_type.created_at,
            updated_at=venue_type.updated_at,
        )

