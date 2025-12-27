"""
Event mapper - handles conversion between domain entities and database models
"""
from app.domain.ticketing.event import Event
from app.infrastructure.shared.database.models import EventModel
from app.shared.enums import EventStatusEnum, EventConfigurationTypeEnum


class EventMapper:
    """Mapper for Event entity to EventModel conversion"""
    
    @staticmethod
    def to_domain(model: EventModel) -> Event:
        """Convert database model to domain entity
        
        Args:
            model: EventModel from database
            
        Returns:
            Event domain entity
        """
        # Handle configuration_type - convert string to enum, handling case variations and None values
        config_type = model.configuration_type
        if not config_type:
            # Use default value if None or empty
            config_type = EventConfigurationTypeEnum.SEAT_SETUP.value
        else:
            # Try to find matching enum by value (case-insensitive)
            config_type_lower = config_type.lower()
            for enum_member in EventConfigurationTypeEnum:
                if enum_member.value.lower() == config_type_lower:
                    config_type = enum_member.value
                    break
            # If no match found, use default
            if config_type not in [e.value for e in EventConfigurationTypeEnum]:
                config_type = EventConfigurationTypeEnum.SEAT_SETUP.value
        
        return Event(
            tenant_id=model.tenant_id,
            show_id=model.show_id,
            title=model.title,
            start_dt=model.start_dt,
            duration_minutes=model.duration_minutes,
            venue_id=model.venue_id,
            layout_id=model.layout_id,
            status=EventStatusEnum(model.status),
            configuration_type=EventConfigurationTypeEnum(config_type),
            event_id=model.id,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    @staticmethod
    def to_model(event: Event) -> EventModel:
        """Convert domain entity to database model
        
        Args:
            event: Event domain entity
            
        Returns:
            EventModel for database persistence
        """
        return EventModel(
            id=event.id,
            tenant_id=event.tenant_id,
            show_id=event.show_id,
            title=event.title,
            start_dt=event.start_dt,
            duration_minutes=event.duration_minutes,
            venue_id=event.venue_id,
            layout_id=event.layout_id,
            status=event.status.value,
            configuration_type=event.configuration_type.value,
            is_active=event.is_active,
            version=event.get_version(),
            created_at=event.created_at,
            updated_at=event.updated_at,
        )

