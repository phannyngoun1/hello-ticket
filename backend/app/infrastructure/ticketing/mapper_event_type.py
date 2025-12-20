"""
EventType mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.ticketing.event_type import EventType
from app.infrastructure.shared.database.models import EventTypeModel


class EventTypeMapper:
    """Mapper for EventType entity to EventTypeModel conversion"""
    
    @staticmethod
    def to_domain(model: EventTypeModel) -> EventType:
        """Convert database model to domain entity
        
        Args:
            model: EventTypeModel from database
            
        Returns:
            EventType domain entity
        """
        return EventType(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            event_type_id=model.id,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    @staticmethod
    def to_model(event_type: EventType) -> EventTypeModel:
        """Convert domain entity to database model
        
        Args:
            event_type: EventType domain entity
            
        Returns:
            EventTypeModel for database persistence
        """
        return EventTypeModel(
            id=event_type.id,
            tenant_id=event_type.tenant_id,
            code=event_type.code,
            name=event_type.name,
            is_active=event_type.is_active,
            version=event_type.get_version(),
            created_at=event_type.created_at,
            updated_at=event_type.updated_at,
        )

