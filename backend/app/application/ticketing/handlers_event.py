"""Handlers for event commands and queries."""
import logging

from app.application.ticketing.commands_event import (
    CreateEventCommand,
    UpdateEventCommand,
    DeleteEventCommand
)
from app.application.ticketing.queries_event import (
    GetEventByIdQuery,
    SearchEventsQuery
)
from app.domain.ticketing.event_repositories import EventRepository, EventSearchResult
from app.domain.ticketing.show_repositories import ShowRepository
from app.domain.ticketing.venue_repositories import VenueRepository
from app.domain.ticketing.layout_repositories import LayoutRepository
from app.domain.ticketing.event import Event
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.application.shared.base.base_application_handler import BaseApplicationHandler

logger = logging.getLogger(__name__)


class EventCommandHandler(BaseApplicationHandler):
    """Handles event commands."""

    def __init__(
        self,
        event_repository: EventRepository,
        show_repository: ShowRepository = None,
        venue_repository: VenueRepository = None,
        layout_repository: LayoutRepository = None,
    ):
        self._event_repository = event_repository
        self._show_repository = show_repository
        self._venue_repository = venue_repository
        self._layout_repository = layout_repository

    async def handle_create_event(self, command: CreateEventCommand) -> Event:
        tenant_id = self.get_tenant_id()

        # Validate show exists and is active
        await self._validate_show(tenant_id, command.show_id)

        # Validate venue exists and is active
        await self._validate_venue(tenant_id, command.venue_id)

        # Validate layout if provided (must belong to the venue)
        if command.layout_id:
            await self._validate_layout(tenant_id, command.layout_id, command.venue_id)

        event = Event(
            tenant_id=tenant_id,
            show_id=command.show_id,
            title=command.title,
            start_dt=command.start_dt,
            duration_minutes=command.duration_minutes,
            venue_id=command.venue_id,
            layout_id=command.layout_id,
            status=command.status,
        )

        saved = await self._event_repository.save(event)
        logger.info("Created event %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_event(self, command: UpdateEventCommand) -> Event:
        tenant_id = self.get_tenant_id()
        event = await self.get_entity_or_404(
            self._event_repository,
            command.event_id,
            "Event",
            tenant_id
        )

        # Validate venue if provided
        venue_id_to_validate = command.venue_id if command.venue_id is not None else event.venue_id
        
        # Validate layout if provided (must belong to the venue)
        if command.layout_id is not None:
            await self._validate_layout(tenant_id, command.layout_id, venue_id_to_validate)

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.title is not None:
            update_kwargs['title'] = command.title
        if command.start_dt is not None:
            update_kwargs['start_dt'] = command.start_dt
        if command.duration_minutes is not None:
            update_kwargs['duration_minutes'] = command.duration_minutes
        if command.venue_id is not None:
            update_kwargs['venue_id'] = command.venue_id
        if command.layout_id is not None:
            update_kwargs['layout_id'] = command.layout_id
        if command.status is not None:
            update_kwargs['status'] = command.status
        event.update_details(**update_kwargs)

        saved = await self._event_repository.save(event)
        logger.info("Updated event %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_event(self, command: DeleteEventCommand) -> bool:
        tenant_id = self.get_tenant_id()
        deleted = await self._event_repository.delete(tenant_id, command.event_id)

        if not deleted:
            raise NotFoundError(f"Event {command.event_id} not found")

        logger.info("Soft deleted event %s for tenant=%s", command.event_id, tenant_id)
        return True



    async def _validate_show(self, tenant_id: str, show_id: str) -> None:
        """Validate that show exists and is active"""
        if not self._show_repository:
            logger.warning("Show repository not configured, skipping show validation")
            return

        if not show_id or not show_id.strip():
            raise ValidationError("Show identifier is required")

        show = await self._show_repository.get_by_id(tenant_id, show_id)
        if not show:
            raise NotFoundError(f"Show {show_id} not found")

        if not show.is_active:
            raise BusinessRuleError(f"Show {show_id} is not active")

    async def _validate_venue(self, tenant_id: str, venue_id: str) -> None:
        """Validate that venue exists and is active"""
        if not self._venue_repository:
            logger.warning("Venue repository not configured, skipping venue validation")
            return

        if not venue_id or not venue_id.strip():
            raise ValidationError("Venue identifier is required")

        venue = await self._venue_repository.get_by_id(tenant_id, venue_id)
        if not venue:
            raise NotFoundError(f"Venue {venue_id} not found")

        if not venue.is_active:
            raise BusinessRuleError(f"Venue {venue_id} is not active")

    async def _validate_layout(self, tenant_id: str, layout_id: str, venue_id: str) -> None:
        """Validate that layout exists, is active, and belongs to the venue"""
        if not self._layout_repository:
            logger.warning("Layout repository not configured, skipping layout validation")
            return

        if not layout_id or not layout_id.strip():
            raise ValidationError("Layout identifier is required")

        layout = await self._layout_repository.get_by_id(tenant_id, layout_id)
        if not layout:
            raise NotFoundError(f"Layout {layout_id} not found")

        if not layout.is_active:
            raise BusinessRuleError(f"Layout {layout_id} is not active")

        if layout.venue_id != venue_id:
            raise BusinessRuleError(f"Layout {layout_id} does not belong to venue {venue_id}")


class EventQueryHandler(BaseApplicationHandler):
    """Handles event queries."""

    def __init__(self, event_repository: EventRepository):
        self._event_repository = event_repository

    async def handle_get_event_by_id(self, query: GetEventByIdQuery) -> Event:
        return await self.get_entity_or_404(
            self._event_repository,
            query.event_id,
            "Event"
        )


    async def handle_search_events(self, query: SearchEventsQuery) -> EventSearchResult:
        tenant_id = self.get_tenant_id()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._event_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            show_id=query.show_id,
            layout_id=query.layout_id,
            status=query.status,
            skip=query.skip,
            limit=query.limit,
        )

