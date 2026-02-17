"""Handlers for lookup commands and queries."""
import logging

from app.application.shared.commands_lookup import (
    CreateLookupCommand,
    UpdateLookupCommand,
    DeleteLookupCommand,
)
from app.application.shared.queries_lookup import (
    GetLookupByIdQuery,
    GetLookupByCodeQuery,
    SearchLookupsQuery,
)
from app.domain.shared.lookup_value import LookupValue
from app.domain.shared.lookup_value_repositories import LookupRepository, LookupSearchResult
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class LookupCommandHandler:
    """Handles lookup master data commands."""

    def __init__(self, lookup_repository: LookupRepository):
        self._lookup_repository = lookup_repository

    async def handle_create_lookup(self, command: CreateLookupCommand) -> LookupValue:
        tenant_id = require_tenant_context()

        existing = await self._lookup_repository.get_by_code(
            tenant_id, command.code, command.type_code
        )
        if existing:
            raise BusinessRuleError(
                f"Lookup code '{command.code}' already exists for type '{command.type_code}'"
            )

        lookup = LookupValue(
            tenant_id=tenant_id,
            type_code=command.type_code,
            code=command.code,
            name=command.name,
        )
        saved = await self._lookup_repository.save(lookup)
        logger.info(
            "Created lookup %s (type=%s) for tenant=%s",
            saved.id,
            command.type_code,
            tenant_id,
        )
        return saved

    async def handle_update_lookup(self, command: UpdateLookupCommand) -> LookupValue:
        tenant_id = require_tenant_context()
        lookup = await self._get_lookup_or_raise(
            tenant_id, command.lookup_id, command.type_code
        )

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != lookup.code:
                duplicate = await self._lookup_repository.get_by_code(
                    tenant_id, normalized_code, command.type_code
                )
                if duplicate and duplicate.id != lookup.id:
                    raise BusinessRuleError(
                        f"Lookup code '{normalized_code}' already exists for type '{command.type_code}'"
                    )

        update_kwargs = {}
        if command.code is not None:
            update_kwargs["code"] = command.code
        if command.name is not None:
            update_kwargs["name"] = command.name
        lookup.update_details(**update_kwargs)

        saved = await self._lookup_repository.save(lookup)
        logger.info(
            "Updated lookup %s (type=%s) for tenant=%s",
            saved.id,
            command.type_code,
            tenant_id,
        )
        return saved

    async def handle_delete_lookup(self, command: DeleteLookupCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._lookup_repository.delete(
            tenant_id, command.lookup_id, command.type_code
        )
        if not deleted:
            raise NotFoundError(
                f"Lookup {command.lookup_id} (type={command.type_code}) not found"
            )
        logger.info(
            "Deleted lookup %s (type=%s) for tenant=%s",
            command.lookup_id,
            command.type_code,
            tenant_id,
        )
        return True

    async def _get_lookup_or_raise(
        self, tenant_id: str, lookup_id: str, type_code: str
    ) -> LookupValue:
        if not lookup_id or not lookup_id.strip():
            raise ValidationError("Lookup identifier is required")
        lookup = await self._lookup_repository.get_by_id(
            tenant_id, lookup_id, type_code
        )
        if not lookup:
            raise NotFoundError(
                f"Lookup {lookup_id} (type={type_code}) not found"
            )
        return lookup


class LookupQueryHandler:
    """Handles lookup queries."""

    def __init__(self, lookup_repository: LookupRepository):
        self._lookup_repository = lookup_repository

    async def handle_get_lookup_by_id(self, query: GetLookupByIdQuery) -> LookupValue:
        tenant_id = require_tenant_context()
        lookup = await self._lookup_repository.get_by_id(
            tenant_id, query.lookup_id, query.type_code
        )
        if not lookup:
            raise NotFoundError(
                f"Lookup {query.lookup_id} (type={query.type_code}) not found"
            )
        return lookup

    async def handle_get_lookup_by_code(
        self, query: GetLookupByCodeQuery
    ) -> LookupValue:
        tenant_id = require_tenant_context()
        lookup = await self._lookup_repository.get_by_code(
            tenant_id, query.code, query.type_code
        )
        if not lookup:
            raise NotFoundError(
                f"Lookup code {query.code} (type={query.type_code}) not found"
            )
        return lookup

    async def handle_search_lookups(
        self, query: SearchLookupsQuery
    ) -> LookupSearchResult:
        tenant_id = require_tenant_context()
        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")
        return await self._lookup_repository.search(
            tenant_id=tenant_id,
            type_code=query.type_code,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )
