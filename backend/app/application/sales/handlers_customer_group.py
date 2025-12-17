"""Handlers for customer_group commands and queries."""
import logging
from typing import List

from app.application.sales.commands_customer_group import (
    CreateCustomerGroupCommand,
    UpdateCustomerGroupCommand,
    DeleteCustomerGroupCommand
)
from app.application.sales.queries_customer_group import (
    GetCustomerGroupByIdQuery,
    GetCustomerGroupByCodeQuery,
    SearchCustomerGroupsQuery,
    GetCustomerGroupTreeQuery,
    GetCustomerGroupChildrenQuery
)
from app.domain.sales.customer_group_repositories import CustomerGroupRepository, CustomerGroupSearchResult
from app.domain.sales.customer_group import CustomerGroup
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class CustomerGroupCommandHandler:
    """Handles customer_group master data commands."""

    def __init__(self, customer_group_repository: CustomerGroupRepository):
        self._customer_group_repository = customer_group_repository


    async def handle_create_customer_group(self, command: CreateCustomerGroupCommand) -> CustomerGroup:
        tenant_id = require_tenant_context()
        code_value = command.code

        
        existing = await self._customer_group_repository.get_by_code(tenant_id, code_value)
        if existing:
            raise BusinessRuleError(f"CustomerGroup code '{code_value}' already exists")

        customer_group = CustomerGroup(
            tenant_id=tenant_id,
            code=code_value,
            name=command.name,
            parent_id=command.parent_id,
            sort_order=command.sort_order,

        )
        logger.info("CustomerGroup: %s", customer_group.parent_id)

        logger.info("Creating customer_group %s for tenant=%s", customer_group.id, tenant_id)
        saved = await self._customer_group_repository.save(customer_group)
        logger.info("Created customer_group %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_customer_group(self, command: UpdateCustomerGroupCommand) -> CustomerGroup:
        tenant_id = require_tenant_context()
        customer_group = await self._get_customer_group_or_raise(tenant_id, command.customer_group_id)

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != customer_group.code:
                duplicate = await self._customer_group_repository.get_by_code(tenant_id, normalized_code)
                if duplicate and duplicate.id != customer_group.id:
                    raise BusinessRuleError(f"CustomerGroup code '{normalized_code}' already exists")

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.parent_id is not None:
            customer_group.set_parent(command.parent_id)
        if command.sort_order is not None:
            customer_group.update_sort_order(command.sort_order)
        if command.code is not None:
            update_kwargs['code'] = command.code
        if command.name is not None:
            update_kwargs['name'] = command.name
        customer_group.update_details(**update_kwargs)

        saved = await self._customer_group_repository.save(customer_group)
        logger.info("Updated customer_group %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_customer_group(self, command: DeleteCustomerGroupCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._customer_group_repository.delete(tenant_id, command.customer_group_id)

        if not deleted:
            raise NotFoundError(f"CustomerGroup {command.customer_group_id} not found")

        logger.info("Soft deleted customer_group %s for tenant=%s", command.customer_group_id, tenant_id)

        logger.info("Deleted customer_group %s for tenant=%s", command.customer_group_id, tenant_id)
        return True


    async def _get_customer_group_or_raise(self, tenant_id: str, customer_group_id: str) -> CustomerGroup:
        if not customer_group_id or not customer_group_id.strip():
            raise ValidationError("CustomerGroup identifier is required")

        customer_group = await self._customer_group_repository.get_by_id(tenant_id, customer_group_id)
        if not customer_group:
            raise NotFoundError(f"CustomerGroup " + str(customer_group_id) + " not found")
        return customer_group


class CustomerGroupQueryHandler:
    """Handles customer_group queries."""

    def __init__(self, customer_group_repository: CustomerGroupRepository):
        self._customer_group_repository = customer_group_repository

    async def handle_get_customer_group_by_id(self, query: GetCustomerGroupByIdQuery) -> CustomerGroup:
        tenant_id = require_tenant_context()
        customer_group = await self._customer_group_repository.get_by_id(tenant_id, query.customer_group_id)
        if not customer_group:
            raise NotFoundError(f"CustomerGroup {query.customer_group_id} not found")
        return customer_group

    async def handle_get_customer_group_by_code(self, query: GetCustomerGroupByCodeQuery) -> CustomerGroup:
        tenant_id = require_tenant_context()
        customer_group = await self._customer_group_repository.get_by_code(tenant_id, query.code)
        if not customer_group:
            raise NotFoundError(f"CustomerGroup code {query.code} not found")
        return customer_group

    async def handle_search_customer_groups(self, query: SearchCustomerGroupsQuery) -> CustomerGroupSearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._customer_group_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )

    async def handle_get_customer_group_tree(self, query: GetCustomerGroupTreeQuery):
        tenant_id = require_tenant_context()
        tree = await self._customer_group_repository.get_customer_group_tree(tenant_id)

        if query.include_inactive:
            return tree

        return self._filter_active_nodes(tree)

    async def handle_get_customer_group_children(
        self, query: GetCustomerGroupChildrenQuery
    ) -> List[CustomerGroup]:
        return await self._customer_group_repository.get_children(
            query.customer_group_id
        )

    def _filter_active_nodes(self, nodes: List[CustomerGroup]) -> List[CustomerGroup]:
        """Filter out inactive nodes (while keeping active descendants)."""
        filtered: List[CustomerGroup] = []
        for node in nodes:
            node.children = self._filter_active_nodes(node.children)
            if node.is_active or node.children:
                filtered.append(node)
        return filtered

