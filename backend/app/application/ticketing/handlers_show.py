"""Handlers for show commands and queries."""
import logging

from app.application.ticketing.commands_show import (
    CreateShowCommand,
    UpdateShowCommand,
    DeleteShowCommand
)
from app.application.ticketing.queries_show import (
    GetShowByIdQuery,
    GetShowByCodeQuery,
    SearchShowsQuery
)
from app.domain.ticketing.show_repositories import ShowRepository, ShowSearchResult
from app.domain.ticketing.show import Show
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class ShowCommandHandler:
    """Handles show master data commands."""

    def __init__(self, show_repository: ShowRepository, code_generator=None):
        self._show_repository = show_repository

        self._code_generator = code_generator

    async def handle_create_show(self, command: CreateShowCommand) -> Show:
        tenant_id = require_tenant_context()
        code_value = command.code

        
        if code_value:
            existing = await self._show_repository.get_by_code(tenant_id, code_value)
            if existing:
                raise BusinessRuleError(f"Show code '{code_value}' already exists")
        else:
            if not self._code_generator:
                raise RuntimeError("Code generator service is not configured for Show")
            code_value = await self._code_generator.generate_code(
                sequence_type="SHO",
                prefix="SHO-",
                digits=6,
                description="Show code"
            )

        show = Show(
            tenant_id=tenant_id,
            code=code_value,
            name=command.name,

        )

        saved = await self._show_repository.save(show)
        logger.info("Created show %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_show(self, command: UpdateShowCommand) -> Show:
        tenant_id = require_tenant_context()
        show = await self._get_show_or_raise(tenant_id, command.show_id)

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != show.code:
                duplicate = await self._show_repository.get_by_code(tenant_id, normalized_code)
                if duplicate and duplicate.id != show.id:
                    raise BusinessRuleError(f"Show code '{normalized_code}' already exists")

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.code is not None:
            update_kwargs['code'] = command.code
        if command.name is not None:
            update_kwargs['name'] = command.name
        show.update_details(**update_kwargs)

        saved = await self._show_repository.save(show)
        logger.info("Updated show %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_show(self, command: DeleteShowCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._show_repository.delete(tenant_id, command.show_id)

        if not deleted:
            raise NotFoundError(f"Show {command.show_id} not found")

        logger.info("Soft deleted show %s for tenant=%s", command.show_id, tenant_id)
        return True


    async def _get_show_or_raise(self, tenant_id: str, show_id: str) -> Show:
        if not show_id or not show_id.strip():
            raise ValidationError("Show identifier is required")

        show = await self._show_repository.get_by_id(tenant_id, show_id)
        if not show:
            raise NotFoundError(f"Show " + str(show_id) + " not found")
        return show


class ShowQueryHandler:
    """Handles show queries."""

    def __init__(self, show_repository: ShowRepository):
        self._show_repository = show_repository

    async def handle_get_show_by_id(self, query: GetShowByIdQuery) -> Show:
        tenant_id = require_tenant_context()
        show = await self._show_repository.get_by_id(tenant_id, query.show_id)
        if not show:
            raise NotFoundError(f"Show {query.show_id} not found")
        return show

    async def handle_get_show_by_code(self, query: GetShowByCodeQuery) -> Show:
        tenant_id = require_tenant_context()
        show = await self._show_repository.get_by_code(tenant_id, query.code)
        if not show:
            raise NotFoundError(f"Show code {query.code} not found")
        return show

    async def handle_search_shows(self, query: SearchShowsQuery) -> ShowSearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._show_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )

