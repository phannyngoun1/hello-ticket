"""Handlers for test commands and queries."""
import logging

from app.application.sales.commands_test import (
    CreateTestCommand,
    UpdateTestCommand,
    DeleteTestCommand
)
from app.application.sales.queries_test import (
    GetTestByIdQuery,
    GetTestByCodeQuery,
    SearchTestsQuery
)
from app.domain.sales.test_repositories import TestRepository, TestSearchResult
from app.domain.sales.test import Test
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class TestCommandHandler:
    """Handles test master data commands."""

    def __init__(self, test_repository: TestRepository, code_generator=None):
        self._test_repository = test_repository

        self._code_generator = code_generator

    async def handle_create_test(self, command: CreateTestCommand) -> Test:
        tenant_id = require_tenant_context()
        code_value = command.code

        
        if code_value:
            existing = await self._test_repository.get_by_code(tenant_id, code_value)
            if existing:
                raise BusinessRuleError(f"Test code '{code_value}' already exists")
        else:
            if not self._code_generator:
                raise RuntimeError("Code generator service is not configured for Test")
            code_value = await self._code_generator.generate_code(
                sequence_type="TES",
                prefix="TES-",
                digits=6,
                description="Test code"
            )

        test = Test(
            tenant_id=tenant_id,
            code=code_value,
            name=command.name,

        )

        saved = await self._test_repository.save(test)
        logger.info("Created test %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_test(self, command: UpdateTestCommand) -> Test:
        tenant_id = require_tenant_context()
        test = await self._get_test_or_raise(tenant_id, command.test_id)

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != test.code:
                duplicate = await self._test_repository.get_by_code(tenant_id, normalized_code)
                if duplicate and duplicate.id != test.id:
                    raise BusinessRuleError(f"Test code '{normalized_code}' already exists")

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.code is not None:
            update_kwargs['code'] = command.code
        if command.name is not None:
            update_kwargs['name'] = command.name
        test.update_details(**update_kwargs)

        saved = await self._test_repository.save(test)
        logger.info("Updated test %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_test(self, command: DeleteTestCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._test_repository.delete(tenant_id, command.test_id)

        if not deleted:
            raise NotFoundError(f"Test {command.test_id} not found")

        logger.info("Soft deleted test %s for tenant=%s", command.test_id, tenant_id)
        return True


    async def _get_test_or_raise(self, tenant_id: str, test_id: str) -> Test:
        if not test_id or not test_id.strip():
            raise ValidationError("Test identifier is required")

        test = await self._test_repository.get_by_id(tenant_id, test_id)
        if not test:
            raise NotFoundError(f"Test " + str(test_id) + " not found")
        return test


class TestQueryHandler:
    """Handles test queries."""

    def __init__(self, test_repository: TestRepository):
        self._test_repository = test_repository

    async def handle_get_test_by_id(self, query: GetTestByIdQuery) -> Test:
        tenant_id = require_tenant_context()
        test = await self._test_repository.get_by_id(tenant_id, query.test_id)
        if not test:
            raise NotFoundError(f"Test {query.test_id} not found")
        return test

    async def handle_get_test_by_code(self, query: GetTestByCodeQuery) -> Test:
        tenant_id = require_tenant_context()
        test = await self._test_repository.get_by_code(tenant_id, query.code)
        if not test:
            raise NotFoundError(f"Test code {query.code} not found")
        return test

    async def handle_search_tests(self, query: SearchTestsQuery) -> TestSearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._test_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )

