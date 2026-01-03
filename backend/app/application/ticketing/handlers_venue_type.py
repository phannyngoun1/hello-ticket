"""Handlers for venue_type commands and queries."""
import logging

from app.application.ticketing.commands_venue_type import (
    CreateVenueTypeCommand,
    UpdateVenueTypeCommand,
    DeleteVenueTypeCommand
)
from app.application.ticketing.queries_venue_type import (
    GetVenueTypeByIdQuery,
    GetVenueTypeByCodeQuery,
    SearchVenueTypesQuery
)
from app.domain.ticketing.venue_type_repositories import VenueTypeRepository, VenueTypeSearchResult
from app.domain.ticketing.venue_type import VenueType
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class VenueTypeCommandHandler:
    """Handles venue_type master data commands."""

    def __init__(self, venue_type_repository: VenueTypeRepository):
        self._venue_type_repository = venue_type_repository


    async def handle_create_venue_type(self, command: CreateVenueTypeCommand) -> VenueType:
        tenant_id = require_tenant_context()
        code_value = command.code

        
        existing = await self._venue_type_repository.get_by_code(tenant_id, code_value)
        if existing:
            raise BusinessRuleError(f"VenueType code '{code_value}' already exists")

        venue_type = VenueType(
            tenant_id=tenant_id,
            code=code_value,
            name=command.name,

        )

        saved = await self._venue_type_repository.save(venue_type)
        logger.info("Created venue_type %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_venue_type(self, command: UpdateVenueTypeCommand) -> VenueType:
        tenant_id = require_tenant_context()
        venue_type = await self._get_venue_type_or_raise(tenant_id, command.venue_type_id)

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != venue_type.code:
                duplicate = await self._venue_type_repository.get_by_code(tenant_id, normalized_code)
                if duplicate and duplicate.id != venue_type.id:
                    raise BusinessRuleError(f"VenueType code '{normalized_code}' already exists")

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.code is not None:
            update_kwargs['code'] = command.code
        if command.name is not None:
            update_kwargs['name'] = command.name
        venue_type.update_details(**update_kwargs)

        saved = await self._venue_type_repository.save(venue_type)
        logger.info("Updated venue_type %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_venue_type(self, command: DeleteVenueTypeCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._venue_type_repository.delete(tenant_id, command.venue_type_id)

        if not deleted:
            raise NotFoundError(f"VenueType {command.venue_type_id} not found")

        logger.info("Soft deleted venue_type %s for tenant=%s", command.venue_type_id, tenant_id)

        logger.info("Deleted venue_type %s for tenant=%s", command.venue_type_id, tenant_id)
        return True


    async def _get_venue_type_or_raise(self, tenant_id: str, venue_type_id: str) -> VenueType:
        if not venue_type_id or not venue_type_id.strip():
            raise ValidationError("VenueType identifier is required")

        venue_type = await self._venue_type_repository.get_by_id(tenant_id, venue_type_id)
        if not venue_type:
            raise NotFoundError(f"VenueType " + str(venue_type_id) + " not found")
        return venue_type


class VenueTypeQueryHandler:
    """Handles venue_type queries."""

    def __init__(self, venue_type_repository: VenueTypeRepository):
        self._venue_type_repository = venue_type_repository

    async def handle_get_venue_type_by_id(self, query: GetVenueTypeByIdQuery) -> VenueType:
        tenant_id = require_tenant_context()
        venue_type = await self._venue_type_repository.get_by_id(tenant_id, query.venue_type_id)
        if not venue_type:
            raise NotFoundError(f"VenueType {query.venue_type_id} not found")
        return venue_type

    async def handle_get_venue_type_by_code(self, query: GetVenueTypeByCodeQuery) -> VenueType:
        tenant_id = require_tenant_context()
        venue_type = await self._venue_type_repository.get_by_code(tenant_id, query.code)
        if not venue_type:
            raise NotFoundError(f"VenueType code {query.code} not found")
        return venue_type

    async def handle_search_venue_types(self, query: SearchVenueTypesQuery) -> VenueTypeSearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._venue_type_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )

