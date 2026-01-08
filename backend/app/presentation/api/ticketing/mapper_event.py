from app.presentation.api.shared.presenter import BasePresenter
from app.domain.ticketing.event import Event
from app.presentation.api.ticketing.schemas_event import EventResponse


class EventPresenter(BasePresenter[Event, EventResponse]):
    """Presenter for converting Event entities to API responses"""

    def from_domain(self, event: Event) -> EventResponse:
        return EventResponse(
            id=event.id,
            tenant_id=event.tenant_id,
            show_id=event.show_id,
            title=event.title,
            start_dt=event.start_dt,
            duration_minutes=event.duration_minutes,
            venue_id=event.venue_id,
            layout_id=event.layout_id,
            status=event.status,
            configuration_type=event.configuration_type,
            is_active=event.is_active,
            created_at=event.created_at,
            updated_at=event.updated_at,
        )

