"""Handlers for event_type commands and queries."""
import logging

from app.application.ticketing.commands_event_type import (
    CreateEventTypeCommand,
    UpdateEventTypeCommand,
    DeleteEventTypeCommand
)
from app.application.ticketing.queries_event_type import (
    GetEventTypeByIdQuery,
    GetEventTypeByCodeQuery,
    SearchEventTypesQuery
)
from app.domain.ticketing.event_type_repositories import EventTypeRepository, EventTypeSearchResult
from app.domain.ticketing.event_type import EventType
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class EventTypeCommandHandler:
    """Handles event_type master data commands."""

    def __init__(self, event_type_repository: EventTypeRepository):
        self._event_type_repository = event_type_repository


    async def handle_create_event_type(self, command: CreateEventTypeCommand) -> EventType:
        tenant_id = require_tenant_context()
        code_value = command.code

        
        existing = await self._event_type_repository.get_by_code(tenant_id, code_value)
        if existing:
            raise BusinessRuleError(f"EventType code '{code_value}' already exists")

        event_type = EventType(
            tenant_id=tenant_id,
            code=code_value,
            name=command.name,

        )

        saved = await self._event_type_repository.save(event_type)
        logger.info("Created event_type %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_event_type(self, command: UpdateEventTypeCommand) -> EventType:
        tenant_id = require_tenant_context()
        event_type = await self._get_event_type_or_raise(tenant_id, command.event_type_id)

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != event_type.code:
                duplicate = await self._event_type_repository.get_by_code(tenant_id, normalized_code)
                if duplicate and duplicate.id != event_type.id:
                    raise BusinessRuleError(f"EventType code '{normalized_code}' already exists")

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.code is not None:
            update_kwargs['code'] = command.code
        if command.name is not None:
            update_kwargs['name'] = command.name
        event_type.update_details(**update_kwargs)

        saved = await self._event_type_repository.save(event_type)
        logger.info("Updated event_type %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_event_type(self, command: DeleteEventTypeCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._event_type_repository.delete(tenant_id, command.event_type_id)

        if not deleted:
            raise NotFoundError(f"EventType {command.event_type_id} not found")

        logger.info("Soft deleted event_type %s for tenant=%s", command.event_type_id, tenant_id)

        logger.info("Deleted event_type %s for tenant=%s", command.event_type_id, tenant_id)
        return True


    async def _get_event_type_or_raise(self, tenant_id: str, event_type_id: str) -> EventType:
        if not event_type_id or not event_type_id.strip():
            raise ValidationError("EventType identifier is required")

        event_type = await self._event_type_repository.get_by_id(tenant_id, event_type_id)
        if not event_type:
            raise NotFoundError(f"EventType " + str(event_type_id) + " not found")
        return event_type


class EventTypeQueryHandler:
    """Handles event_type queries."""

    def __init__(self, event_type_repository: EventTypeRepository):
        self._event_type_repository = event_type_repository

    async def handle_get_event_type_by_id(self, query: GetEventTypeByIdQuery) -> EventType:
        tenant_id = require_tenant_context()
        event_type = await self._event_type_repository.get_by_id(tenant_id, query.event_type_id)
        if not event_type:
            raise NotFoundError(f"EventType {query.event_type_id} not found")
        return event_type

    async def handle_get_event_type_by_code(self, query: GetEventTypeByCodeQuery) -> EventType:
        tenant_id = require_tenant_context()
        event_type = await self._event_type_repository.get_by_code(tenant_id, query.code)
        if not event_type:
            raise NotFoundError(f"EventType code {query.code} not found")
        return event_type

    async def handle_search_event_types(self, query: SearchEventTypesQuery) -> EventTypeSearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._event_type_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )

