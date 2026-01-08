"""
VenueType mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.ticketing.venue_type import VenueType
from app.infrastructure.shared.database.models import VenueTypeModel
from app.infrastructure.shared.mapper import BaseMapper


class VenueTypeMapper(BaseMapper[VenueType, VenueTypeModel]):
    """Mapper for VenueType entity to VenueTypeModel conversion"""
    
    def to_domain(self, model: VenueTypeModel) -> Optional[VenueType]:
        """Convert database model to domain entity
        
        Args:
            model: VenueTypeModel from database
            
        Returns:
            VenueType domain entity
        """
        if not model:
            return None
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
    
    def to_model(self, venue_type: VenueType) -> Optional[VenueTypeModel]:
        """Convert domain entity to database model
        
        Args:
            venue_type: VenueType domain entity
            
        Returns:
            VenueTypeModel for database persistence
        """
        if not venue_type:
            return None
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

