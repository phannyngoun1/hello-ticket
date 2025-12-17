"""Handlers for {{EntityNameLower}} commands and queries."""
import logging

from app.application.{{moduleName}}.commands_{{EntityNameLower}} import (
    {{CommandImports}}
)
from app.application.{{moduleName}}.queries_{{EntityNameLower}} import (
    {{QueryImports}}
)
from app.domain.{{moduleName}}.{{EntityNameLower}}_repositories import {{EntityName}}Repository, {{EntityName}}SearchResult
from app.domain.{{moduleName}}.{{EntityNameLower}} import {{EntityName}}
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class {{EntityName}}CommandHandler:
    """Handles {{EntityNameLower}} master data commands."""

    def __init__(self, {{EntityNameLower}}_repository: {{EntityName}}Repository{{CodeGeneratorInitParam}}):
        self._{{EntityNameLower}}_repository = {{EntityNameLower}}_repository
{{CodeGeneratorInitAssignment}}

    async def handle_create_{{EntityNameLower}}(self, command: Create{{EntityName}}Command) -> {{EntityName}}:
        tenant_id = require_tenant_context()
        code_value = command.code

        {{CreateValidation}}
{{CodeGenerationLogic}}

        {{EntityNameLower}} = {{EntityName}}(
            tenant_id=tenant_id,
            code=code_value,
            name=command.name,
{{CreateEntityFields}}
        )

        saved = await self._{{EntityNameLower}}_repository.save({{EntityNameLower}})
        logger.info("Created {{EntityNameLower}} %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_{{EntityNameLower}}(self, command: Update{{EntityName}}Command) -> {{EntityName}}:
        tenant_id = require_tenant_context()
        {{EntityNameLower}} = await self._get_{{EntityNameLower}}_or_raise(tenant_id, command.{{EntityNameLower}}_id)

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != {{EntityNameLower}}.code:
                duplicate = await self._{{EntityNameLower}}_repository.get_by_code(tenant_id, normalized_code)
                if duplicate and duplicate.id != {{EntityNameLower}}.id:
                    raise BusinessRuleError(f"{{EntityName}} code '{normalized_code}' already exists")

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
{{UpdateEntityFields}}
        {{EntityNameLower}}.update_details(**update_kwargs)

        saved = await self._{{EntityNameLower}}_repository.save({{EntityNameLower}})
        logger.info("Updated {{EntityNameLower}} %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_{{EntityNameLower}}(self, command: Delete{{EntityName}}Command) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._{{EntityNameLower}}_repository.delete(tenant_id, command.{{EntityNameLower}}_id)

        if not deleted:
            raise NotFoundError(f"{{EntityName}} {command.{{EntityNameLower}}_id} not found")

        logger.info("Soft deleted {{EntityNameLower}} %s for tenant=%s", command.{{EntityNameLower}}_id, tenant_id)
        return True

{{ActivateDeactivateHandlers}}
    async def _get_{{EntityNameLower}}_or_raise(self, tenant_id: str, {{EntityNameLower}}_id: str) -> {{EntityName}}:
        if not {{EntityNameLower}}_id or not {{EntityNameLower}}_id.strip():
            raise ValidationError("{{EntityName}} identifier is required")

        {{EntityNameLower}} = await self._{{EntityNameLower}}_repository.get_by_id(tenant_id, {{EntityNameLower}}_id)
        if not {{EntityNameLower}}:
            raise NotFoundError(f"{{EntityName}} " + str({{EntityNameLower}}_id) + " not found")
        return {{EntityNameLower}}


class {{EntityName}}QueryHandler:
    """Handles {{EntityNameLower}} queries."""

    def __init__(self, {{EntityNameLower}}_repository: {{EntityName}}Repository):
        self._{{EntityNameLower}}_repository = {{EntityNameLower}}_repository

    async def handle_get_{{EntityNameLower}}_by_id(self, query: Get{{EntityName}}ByIdQuery) -> {{EntityName}}:
        tenant_id = require_tenant_context()
        {{EntityNameLower}} = await self._{{EntityNameLower}}_repository.get_by_id(tenant_id, query.{{EntityNameLower}}_id)
        if not {{EntityNameLower}}:
            raise NotFoundError(f"{{EntityName}} {query.{{EntityNameLower}}_id} not found")
        return {{EntityNameLower}}

    async def handle_get_{{EntityNameLower}}_by_code(self, query: Get{{EntityName}}ByCodeQuery) -> {{EntityName}}:
        tenant_id = require_tenant_context()
        {{EntityNameLower}} = await self._{{EntityNameLower}}_repository.get_by_code(tenant_id, query.code)
        if not {{EntityNameLower}}:
            raise NotFoundError(f"{{EntityName}} code {query.code} not found")
        return {{EntityNameLower}}

    async def handle_search_{{EntityNamePluralSnake}}(self, query: Search{{EntityNamePlural}}Query) -> {{EntityName}}SearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._{{EntityNameLower}}_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            include_deleted=query.include_deleted,
            skip=query.skip,
            limit=query.limit,
        )

