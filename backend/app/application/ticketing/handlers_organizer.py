"""Handlers for organizer commands and queries."""
import logging

from app.application.ticketing.commands_organizer import (
    CreateOrganizerCommand,
    UpdateOrganizerCommand,
    DeleteOrganizerCommand
)
from app.application.ticketing.queries_organizer import (
    GetOrganizerByIdQuery,
    GetOrganizerByCodeQuery,
    SearchOrganizersQuery,
    GetOrganizersByIdsQuery,
)
from typing import List
from app.domain.ticketing.organizer_repositories import OrganizerRepository, OrganizerSearchResult
from app.domain.ticketing.organizer import Organizer
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class OrganizerCommandHandler:
    """Handles organizer master data commands."""

    def __init__(self, organizer_repository: OrganizerRepository, code_generator=None):
        self._organizer_repository = organizer_repository

        self._code_generator = code_generator

    async def handle_create_organizer(self, command: CreateOrganizerCommand) -> Organizer:
        tenant_id = require_tenant_context()
        code_value = command.code

        
        if code_value:
            existing = await self._organizer_repository.get_by_code(tenant_id, code_value)
            if existing:
                raise BusinessRuleError(f"Organizer code '{code_value}' already exists")
        else:
            if not self._code_generator:
                raise RuntimeError("Code generator service is not configured for Organizer")
            code_value = await self._code_generator.generate_code(
                sequence_type="ORG",
                prefix="ORG-",
                digits=6,
                description="Organizer code"
            )

        organizer = Organizer(
            tenant_id=tenant_id,
            code=code_value,
            name=command.name,
            description=command.description,
            email=command.email,
            phone=command.phone,
            website=command.website,
            address=command.address,
            city=command.city,
            country=command.country,
            logo=command.logo,
            tags=command.tags,
        )

        saved = await self._organizer_repository.save(organizer)
        logger.info("Created organizer %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_organizer(self, command: UpdateOrganizerCommand) -> Organizer:
        tenant_id = require_tenant_context()
        organizer = await self._get_organizer_or_raise(tenant_id, command.organizer_id)

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != organizer.code:
                duplicate = await self._organizer_repository.get_by_code(tenant_id, normalized_code)
                if duplicate and duplicate.id != organizer.id:
                    raise BusinessRuleError(f"Organizer code '{normalized_code}' already exists")

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.code is not None:
            update_kwargs['code'] = command.code
        if command.name is not None:
            update_kwargs['name'] = command.name
        if command.description is not None:
            update_kwargs['description'] = command.description
        if command.email is not None:
            update_kwargs['email'] = command.email
        if command.phone is not None:
            update_kwargs['phone'] = command.phone
        if command.website is not None:
            update_kwargs['website'] = command.website
        if command.address is not None:
            update_kwargs['address'] = command.address
        if command.city is not None:
            update_kwargs['city'] = command.city
        if command.country is not None:
            update_kwargs['country'] = command.country
        if command.logo is not None:
            update_kwargs['logo'] = command.logo
        if command.tags is not None:
            update_kwargs['tags'] = command.tags
            
        organizer.update_details(**update_kwargs)

        saved = await self._organizer_repository.save(organizer)
        logger.info("Updated organizer %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_organizer(self, command: DeleteOrganizerCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._organizer_repository.delete(tenant_id, command.organizer_id)

        if not deleted:
            raise NotFoundError(f"Organizer {command.organizer_id} not found")

        logger.info("Soft deleted organizer %s for tenant=%s", command.organizer_id, tenant_id)
        return True


    async def _get_organizer_or_raise(self, tenant_id: str, organizer_id: str) -> Organizer:
        if not organizer_id or not organizer_id.strip():
            raise ValidationError("Organizer identifier is required")

        organizer = await self._organizer_repository.get_by_id(tenant_id, organizer_id)
        if not organizer:
            raise NotFoundError(f"Organizer " + str(organizer_id) + " not found")
        return organizer


class OrganizerQueryHandler:
    """Handles organizer queries."""

    def __init__(self, organizer_repository: OrganizerRepository):
        self._organizer_repository = organizer_repository

    async def handle_get_organizer_by_id(self, query: GetOrganizerByIdQuery) -> Organizer:
        tenant_id = require_tenant_context()
        organizer = await self._organizer_repository.get_by_id(tenant_id, query.organizer_id)
        if not organizer:
            raise NotFoundError(f"Organizer {query.organizer_id} not found")
        return organizer

    async def handle_get_organizer_by_code(self, query: GetOrganizerByCodeQuery) -> Organizer:
        tenant_id = require_tenant_context()
        organizer = await self._organizer_repository.get_by_code(tenant_id, query.code)
        if not organizer:
            raise NotFoundError(f"Organizer code {query.code} not found")
        return organizer

    async def handle_search_organizers(self, query: SearchOrganizersQuery) -> OrganizerSearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._organizer_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )

    async def handle_get_organizers_by_ids(self, query: GetOrganizersByIdsQuery) -> List[Organizer]:
        tenant_id = require_tenant_context()
        if not query.organizer_ids:
            return []
        return await self._organizer_repository.get_by_ids(tenant_id, query.organizer_ids)

