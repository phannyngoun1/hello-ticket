"""Handlers for customer_type commands and queries."""
import logging

from app.application.sales.commands_customer_type import (
    CreateCustomerTypeCommand,
    UpdateCustomerTypeCommand,
    DeleteCustomerTypeCommand
)
from app.application.sales.queries_customer_type import (
    GetCustomerTypeByIdQuery,
    GetCustomerTypeByCodeQuery,
    SearchCustomerTypesQuery
)
from app.domain.sales.customer_type_repositories import CustomerTypeRepository, CustomerTypeSearchResult
from app.domain.sales.customer_type import CustomerType
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class CustomerTypeCommandHandler:
    """Handles customer_type master data commands."""

    def __init__(self, customer_type_repository: CustomerTypeRepository):
        self._customer_type_repository = customer_type_repository

    async def handle_create_customer_type(self, command: CreateCustomerTypeCommand) -> CustomerType:
        tenant_id = require_tenant_context()

        
        existing = await self._customer_type_repository.get_by_code(tenant_id, command.code)
        if existing:
            raise BusinessRuleError(f"CustomerType code '{command.code}' already exists")

        customer_type = CustomerType(
            tenant_id=tenant_id,
            code=command.code,
            name=command.name,

        )

        saved = await self._customer_type_repository.save(customer_type)
        logger.info("Created customer_type %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_customer_type(self, command: UpdateCustomerTypeCommand) -> CustomerType:
        tenant_id = require_tenant_context()
        customer_type = await self._get_customer_type_or_raise(tenant_id, command.customer_type_id)

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != customer_type.code:
                duplicate = await self._customer_type_repository.get_by_code(tenant_id, normalized_code)
                if duplicate and duplicate.id != customer_type.id:
                    raise BusinessRuleError(f"CustomerType code '{normalized_code}' already exists")

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.code is not None:
            update_kwargs['code'] = command.code
        if command.name is not None:
            update_kwargs['name'] = command.name
        customer_type.update_details(**update_kwargs)

        saved = await self._customer_type_repository.save(customer_type)
        logger.info("Updated customer_type %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_customer_type(self, command: DeleteCustomerTypeCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._customer_type_repository.delete(tenant_id, command.customer_type_id)

        if not deleted:
            raise NotFoundError(f"CustomerType {command.customer_type_id} not found")

        logger.info("Soft deleted customer_type %s for tenant=%s", command.customer_type_id, tenant_id)

        logger.info("Deleted customer_type %s for tenant=%s", command.customer_type_id, tenant_id)
        return True


    async def _get_customer_type_or_raise(self, tenant_id: str, customer_type_id: str) -> CustomerType:
        if not customer_type_id or not customer_type_id.strip():
            raise ValidationError("CustomerType identifier is required")

        customer_type = await self._customer_type_repository.get_by_id(tenant_id, customer_type_id)
        if not customer_type:
            raise NotFoundError(f"CustomerType " + str(customer_type_id) + " not found")
        return customer_type


class CustomerTypeQueryHandler:
    """Handles customer_type queries."""

    def __init__(self, customer_type_repository: CustomerTypeRepository):
        self._customer_type_repository = customer_type_repository

    async def handle_get_customer_type_by_id(self, query: GetCustomerTypeByIdQuery) -> CustomerType:
        tenant_id = require_tenant_context()
        customer_type = await self._customer_type_repository.get_by_id(tenant_id, query.customer_type_id)
        if not customer_type:
            raise NotFoundError(f"CustomerType {query.customer_type_id} not found")
        return customer_type

    async def handle_get_customer_type_by_code(self, query: GetCustomerTypeByCodeQuery) -> CustomerType:
        tenant_id = require_tenant_context()
        customer_type = await self._customer_type_repository.get_by_code(tenant_id, query.code)
        if not customer_type:
            raise NotFoundError(f"CustomerType code {query.code} not found")
        return customer_type

    async def handle_search_customer_types(self, query: SearchCustomerTypesQuery) -> CustomerTypeSearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._customer_type_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )

