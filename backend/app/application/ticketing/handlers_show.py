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
from app.domain.ticketing.organizer_repositories import OrganizerRepository
from app.domain.ticketing.show import Show
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class ShowCommandHandler:
    """Handles show master data commands."""

    def __init__(self, show_repository: ShowRepository, organizer_repository: OrganizerRepository = None, code_generator=None):
        self._show_repository = show_repository
        self._organizer_repository = organizer_repository
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

        # Validate organizer if provided
        if command.organizer_id:
            await self._validate_organizer(tenant_id, command.organizer_id)

        show = Show(
            tenant_id=tenant_id,
            code=code_value,
            name=command.name,
            organizer_id=command.organizer_id,
            started_date=command.started_date,
            ended_date=command.ended_date,
            images=command.images,
            note=command.note,
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

        # Validate organizer if provided
        if command.organizer_id is not None:
            await self._validate_organizer(tenant_id, command.organizer_id)

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.code is not None:
            update_kwargs['code'] = command.code
        if command.name is not None:
            update_kwargs['name'] = command.name
        if command.organizer_id is not None:
            update_kwargs['organizer_id'] = command.organizer_id
        if command.started_date is not None:
            update_kwargs['started_date'] = command.started_date
        if command.ended_date is not None:
            update_kwargs['ended_date'] = command.ended_date
        if command.images is not None:
            update_kwargs['images'] = command.images
        if command.note is not None:
            update_kwargs['note'] = command.note
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

    async def _validate_organizer(self, tenant_id: str, organizer_id: str) -> None:
        """Validate that organizer exists and is active"""
        if not self._organizer_repository:
            logger.warning("Organizer repository not configured, skipping organizer validation")
            return
        
        if not organizer_id or not organizer_id.strip():
            raise ValidationError("Organizer identifier is required")
        
        organizer = await self._organizer_repository.get_by_id(tenant_id, organizer_id)
        if not organizer:
            raise NotFoundError(f"Organizer {organizer_id} not found")
        
        if not organizer.is_active:
            raise BusinessRuleError(f"Organizer {organizer_id} is not active")


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

