"""Handlers for test_tree commands and queries."""
import logging
from typing import List

from app.application.sales.commands_test_tree import (
    CreateTestTreeCommand,
    UpdateTestTreeCommand,
    DeleteTestTreeCommand
)
from app.application.sales.queries_test_tree import (
    GetTestTreeByIdQuery,
    GetTestTreeByCodeQuery,
    SearchTestTreesQuery,
    GetTestTreeTreeQuery,
    GetTestTreeChildrenQuery
)
from app.domain.sales.test_tree_repositories import TestTreeRepository, TestTreeSearchResult
from app.domain.sales.test_tree import TestTree
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class TestTreeCommandHandler:
    """Handles test_tree master data commands."""

    def __init__(self, test_tree_repository: TestTreeRepository):
        self._test_tree_repository = test_tree_repository


    async def handle_create_test_tree(self, command: CreateTestTreeCommand) -> TestTree:
        tenant_id = require_tenant_context()
        code_value = command.code

        
        existing = await self._test_tree_repository.get_by_code(tenant_id, code_value)
        if existing:
            raise BusinessRuleError(f"TestTree code '{code_value}' already exists")

        test_tree = TestTree(
            tenant_id=tenant_id,
            code=code_value,
            name=command.name,
            parent_test_tree_id=command.parent_test_tree_id,
            sort_order=command.sort_order,

        )

        saved = await self._test_tree_repository.save(test_tree)
        logger.info("Created test_tree %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_test_tree(self, command: UpdateTestTreeCommand) -> TestTree:
        tenant_id = require_tenant_context()
        test_tree = await self._get_test_tree_or_raise(tenant_id, command.test_tree_id)

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != test_tree.code:
                duplicate = await self._test_tree_repository.get_by_code(tenant_id, normalized_code)
                if duplicate and duplicate.id != test_tree.id:
                    raise BusinessRuleError(f"TestTree code '{normalized_code}' already exists")

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.parent_test_tree_id is not None:
            test_tree.set_parent(command.parent_test_tree_id)
        if command.sort_order is not None:
            test_tree.update_sort_order(command.sort_order)
        if command.code is not None:
            update_kwargs['code'] = command.code
        if command.name is not None:
            update_kwargs['name'] = command.name
        test_tree.update_details(**update_kwargs)

        saved = await self._test_tree_repository.save(test_tree)
        logger.info("Updated test_tree %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_test_tree(self, command: DeleteTestTreeCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._test_tree_repository.delete(tenant_id, command.test_tree_id)

        if not deleted:
            raise NotFoundError(f"TestTree {command.test_tree_id} not found")

        logger.info("Soft deleted test_tree %s for tenant=%s", command.test_tree_id, tenant_id)

        logger.info("Deleted test_tree %s for tenant=%s", command.test_tree_id, tenant_id)
        return True


    async def _get_test_tree_or_raise(self, tenant_id: str, test_tree_id: str) -> TestTree:
        if not test_tree_id or not test_tree_id.strip():
            raise ValidationError("TestTree identifier is required")

        test_tree = await self._test_tree_repository.get_by_id(tenant_id, test_tree_id)
        if not test_tree:
            raise NotFoundError(f"TestTree " + str(test_tree_id) + " not found")
        return test_tree


class TestTreeQueryHandler:
    """Handles test_tree queries."""

    def __init__(self, test_tree_repository: TestTreeRepository):
        self._test_tree_repository = test_tree_repository

    async def handle_get_test_tree_by_id(self, query: GetTestTreeByIdQuery) -> TestTree:
        tenant_id = require_tenant_context()
        test_tree = await self._test_tree_repository.get_by_id(tenant_id, query.test_tree_id)
        if not test_tree:
            raise NotFoundError(f"TestTree {query.test_tree_id} not found")
        return test_tree

    async def handle_get_test_tree_by_code(self, query: GetTestTreeByCodeQuery) -> TestTree:
        tenant_id = require_tenant_context()
        test_tree = await self._test_tree_repository.get_by_code(tenant_id, query.code)
        if not test_tree:
            raise NotFoundError(f"TestTree code {query.code} not found")
        return test_tree

    async def handle_search_test_trees(self, query: SearchTestTreesQuery) -> TestTreeSearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._test_tree_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )

    async def handle_get_test_tree_tree(self, query: GetTestTreeTreeQuery):
        tenant_id = require_tenant_context()
        tree = await self._test_tree_repository.get_test_tree_tree(tenant_id)

        if query.include_inactive:
            return tree

        return self._filter_active_nodes(tree)

    async def handle_get_test_tree_children(
        self, query: GetTestTreeChildrenQuery
    ) -> List[TestTree]:
        return await self._test_tree_repository.get_children(
            query.test_tree_id
        )

    def _filter_active_nodes(self, nodes: List[TestTree]) -> List[TestTree]:
        """Filter out inactive nodes (while keeping active descendants)."""
        filtered: List[TestTree] = []
        for node in nodes:
            node.children = self._filter_active_nodes(node.children)
            if node.is_active or node.children:
                filtered.append(node)
        return filtered

