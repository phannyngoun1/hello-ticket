"""Handlers for customer commands and queries."""
import logging

from app.application.sales.commands import (
    CreateCustomerCommand,
    UpdateCustomerCommand,
    DeleteCustomerCommand
)
from app.application.sales.queries import (
    GetCustomerByIdQuery,
    GetCustomerByCodeQuery,
    SearchCustomersQuery
)
from app.domain.sales.repositories import CustomerRepository, CustomerSearchResult
from app.domain.sales.customer import Customer
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)

class CustomerCommandHandler:
    """Handles customer master data commands."""

    def __init__(self, customer_repository: CustomerRepository):
        self._customer_repository = customer_repository

    async def handle_create_customer(self, command: CreateCustomerCommand) -> Customer:
        tenant_id = require_tenant_context()

        if not command.code or not command.code.strip():
            raise ValidationError("Code is required")
        if not command.name or not command.name.strip():
            raise ValidationError("Name is required")
        existing = await self._customer_repository.get_by_code(tenant_id, command.code)
        if existing:
            raise BusinessRuleError(f"Customer code '{command.code}' already exists")

        customer = Customer(
            tenant_id=tenant_id,
            code=command.code,
            name=command.name,
        )

        saved = await self._customer_repository.save(customer)
        logger.info("Created customer %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_customer(self, command: UpdateCustomerCommand) -> Customer:
        tenant_id = require_tenant_context()
        customer = await self._get_customer_or_raise(tenant_id, command.customer_id)

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != customer.code:
                duplicate = await self._customer_repository.get_by_code(tenant_id, normalized_code)
                if duplicate and duplicate.id != customer.id:
                    raise BusinessRuleError(f"Customer code '{normalized_code}' already exists")

        customer.update_details(
            code=command.code if command.code is not None else None,
            name=command.name if command.name is not None else None,
        )

        saved = await self._customer_repository.save(customer)
        logger.info("Updated customer %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_customer(self, command: DeleteCustomerCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._customer_repository.delete(tenant_id, command.customer_id)

        if not deleted:
            raise NotFoundError(f"Customer {command.customer_id} not found")

        logger.info("Deleted customer %s for tenant=%s", command.customer_id, tenant_id)
        return True

    async def _get_customer_or_raise(self, tenant_id: str, customer_id: str) -> Customer:
        if not customer_id or not customer_id.strip():
            raise ValidationError("Customer identifier is required")

        customer = await self._customer_repository.get_by_id(tenant_id, customer_id)
        if not customer:
            raise NotFoundError(f"Customer " + str(customer_id) + " not found")
        return customer

class CustomerQueryHandler:
    """Handles customer queries."""

    def __init__(self, customer_repository: CustomerRepository):
        self._customer_repository = customer_repository

    async def handle_get_customer_by_id(self, query: GetCustomerByIdQuery) -> Customer:
        tenant_id = require_tenant_context()
        customer = await self._customer_repository.get_by_id(tenant_id, query.customer_id)
        if not customer:
            raise NotFoundError(f"Customer {query.customer_id} not found")
        return customer

    async def handle_get_customer_by_code(self, query: GetCustomerByCodeQuery) -> Customer:
        tenant_id = require_tenant_context()
        customer = await self._customer_repository.get_by_code(tenant_id, query.code)
        if not customer:
            raise NotFoundError(f"Customer code {query.code} not found")
        return customer

    async def handle_search_customers(self, query: SearchCustomersQuery) -> CustomerSearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._customer_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )
