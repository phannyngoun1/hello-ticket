"""API mapper for Ticketing module"""
from app.domain.ticketing.event_type import EventType
from app.presentation.api.ticketing.schemas_event_type import EventTypeResponse


class TicketingApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def event_type_to_response(event_type: EventType) -> EventTypeResponse:
        return EventTypeResponse(
            id=event_type.id,
            tenant_id=event_type.tenant_id,
            code=event_type.code,
            name=event_type.name,

            is_active=event_type.is_active,
            created_at=event_type.created_at,
            updated_at=event_type.updated_at,
        )

