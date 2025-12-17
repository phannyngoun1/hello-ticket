"""Handlers for test_basic commands and queries."""
import logging

from app.application.sales.commands_test_basic import (
    CreateTestBasicCommand,
    UpdateTestBasicCommand,
    DeleteTestBasicCommand
)
from app.application.sales.queries_test_basic import (
    GetTestBasicByIdQuery,
    GetTestBasicByCodeQuery,
    SearchTestBasicsQuery
)
from app.domain.sales.test_basic_repositories import TestBasicRepository, TestBasicSearchResult
from app.domain.sales.test_basic import TestBasic
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class TestBasicCommandHandler:
    """Handles test_basic master data commands."""

    def __init__(self, test_basic_repository: TestBasicRepository):
        self._test_basic_repository = test_basic_repository


    async def handle_create_test_basic(self, command: CreateTestBasicCommand) -> TestBasic:
        tenant_id = require_tenant_context()
        code_value = command.code

        
        existing = await self._test_basic_repository.get_by_code(tenant_id, code_value)
        if existing:
            raise BusinessRuleError(f"TestBasic code '{code_value}' already exists")

        test_basic = TestBasic(
            tenant_id=tenant_id,
            code=code_value,
            name=command.name,

        )

        saved = await self._test_basic_repository.save(test_basic)
        logger.info("Created test_basic %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_test_basic(self, command: UpdateTestBasicCommand) -> TestBasic:
        tenant_id = require_tenant_context()
        test_basic = await self._get_test_basic_or_raise(tenant_id, command.test_basic_id)

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != test_basic.code:
                duplicate = await self._test_basic_repository.get_by_code(tenant_id, normalized_code)
                if duplicate and duplicate.id != test_basic.id:
                    raise BusinessRuleError(f"TestBasic code '{normalized_code}' already exists")

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.code is not None:
            update_kwargs['code'] = command.code
        if command.name is not None:
            update_kwargs['name'] = command.name
        test_basic.update_details(**update_kwargs)

        saved = await self._test_basic_repository.save(test_basic)
        logger.info("Updated test_basic %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_test_basic(self, command: DeleteTestBasicCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._test_basic_repository.delete(tenant_id, command.test_basic_id)

        if not deleted:
            raise NotFoundError(f"TestBasic {command.test_basic_id} not found")

        logger.info("Soft deleted test_basic %s for tenant=%s", command.test_basic_id, tenant_id)

        logger.info("Deleted test_basic %s for tenant=%s", command.test_basic_id, tenant_id)
        return True


    async def _get_test_basic_or_raise(self, tenant_id: str, test_basic_id: str) -> TestBasic:
        if not test_basic_id or not test_basic_id.strip():
            raise ValidationError("TestBasic identifier is required")

        test_basic = await self._test_basic_repository.get_by_id(tenant_id, test_basic_id)
        if not test_basic:
            raise NotFoundError(f"TestBasic " + str(test_basic_id) + " not found")
        return test_basic


class TestBasicQueryHandler:
    """Handles test_basic queries."""

    def __init__(self, test_basic_repository: TestBasicRepository):
        self._test_basic_repository = test_basic_repository

    async def handle_get_test_basic_by_id(self, query: GetTestBasicByIdQuery) -> TestBasic:
        tenant_id = require_tenant_context()
        test_basic = await self._test_basic_repository.get_by_id(tenant_id, query.test_basic_id)
        if not test_basic:
            raise NotFoundError(f"TestBasic {query.test_basic_id} not found")
        return test_basic

    async def handle_get_test_basic_by_code(self, query: GetTestBasicByCodeQuery) -> TestBasic:
        tenant_id = require_tenant_context()
        test_basic = await self._test_basic_repository.get_by_code(tenant_id, query.code)
        if not test_basic:
            raise NotFoundError(f"TestBasic code {query.code} not found")
        return test_basic

    async def handle_search_test_basics(self, query: SearchTestBasicsQuery) -> TestBasicSearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._test_basic_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )

