"""Handlers for venue commands and queries."""
import logging

from app.application.ticketing.commands_venue import (
    CreateVenueCommand,
    UpdateVenueCommand,
    DeleteVenueCommand
)
from app.application.ticketing.queries_venue import (
    GetVenueByIdQuery,
    GetVenueByCodeQuery,
    SearchVenuesQuery
)
from app.domain.ticketing.venue_repositories import VenueRepository, VenueSearchResult
from app.domain.ticketing.venue import Venue
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class VenueCommandHandler:
    """Handles venue master data commands."""

    def __init__(self, venue_repository: VenueRepository, code_generator=None):
        self._venue_repository = venue_repository

        self._code_generator = code_generator

    async def handle_create_venue(self, command: CreateVenueCommand) -> Venue:
        tenant_id = require_tenant_context()
        code_value = command.code

        
        if code_value:
            existing = await self._venue_repository.get_by_code(tenant_id, code_value)
            if existing:
                raise BusinessRuleError(f"Venue code '{code_value}' already exists")
        else:
            if not self._code_generator:
                raise RuntimeError("Code generator service is not configured for Venue")
            code_value = await self._code_generator.generate_code(
                sequence_type="VEN",
                prefix="VEN-",
                digits=6,
                description="Venue code"
            )

        venue = Venue(
            tenant_id=tenant_id,
            code=code_value,
            name=command.name,

        )

        saved = await self._venue_repository.save(venue)
        logger.info("Created venue %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_venue(self, command: UpdateVenueCommand) -> Venue:
        tenant_id = require_tenant_context()
        venue = await self._get_venue_or_raise(tenant_id, command.venue_id)

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != venue.code:
                duplicate = await self._venue_repository.get_by_code(tenant_id, normalized_code)
                if duplicate and duplicate.id != venue.id:
                    raise BusinessRuleError(f"Venue code '{normalized_code}' already exists")

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.code is not None:
            update_kwargs['code'] = command.code
        if command.name is not None:
            update_kwargs['name'] = command.name
        if command.image_url is not None:
            update_kwargs['image_url'] = command.image_url
        venue.update_details(**update_kwargs)

        saved = await self._venue_repository.save(venue)
        logger.info("Updated venue %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_venue(self, command: DeleteVenueCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._venue_repository.delete(tenant_id, command.venue_id)

        if not deleted:
            raise NotFoundError(f"Venue {command.venue_id} not found")

        logger.info("Soft deleted venue %s for tenant=%s", command.venue_id, tenant_id)
        return True


    async def _get_venue_or_raise(self, tenant_id: str, venue_id: str) -> Venue:
        if not venue_id or not venue_id.strip():
            raise ValidationError("Venue identifier is required")

        venue = await self._venue_repository.get_by_id(tenant_id, venue_id)
        if not venue:
            raise NotFoundError(f"Venue " + str(venue_id) + " not found")
        return venue


class VenueQueryHandler:
    """Handles venue queries."""

    def __init__(self, venue_repository: VenueRepository):
        self._venue_repository = venue_repository

    async def handle_get_venue_by_id(self, query: GetVenueByIdQuery) -> Venue:
        tenant_id = require_tenant_context()
        venue = await self._venue_repository.get_by_id(tenant_id, query.venue_id)
        if not venue:
            raise NotFoundError(f"Venue {query.venue_id} not found")
        return venue

    async def handle_get_venue_by_code(self, query: GetVenueByCodeQuery) -> Venue:
        tenant_id = require_tenant_context()
        venue = await self._venue_repository.get_by_code(tenant_id, query.code)
        if not venue:
            raise NotFoundError(f"Venue code {query.code} not found")
        return venue

    async def handle_search_venues(self, query: SearchVenuesQuery) -> VenueSearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._venue_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )

