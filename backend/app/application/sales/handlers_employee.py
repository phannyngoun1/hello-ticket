"""Handlers for employee commands and queries."""
import logging

from app.application.sales.commands_employee import (
    CreateEmployeeCommand,
    UpdateEmployeeCommand,
    DeleteEmployeeCommand
)
from app.application.sales.queries_employee import (
    GetEmployeeByIdQuery,
    GetEmployeeByCodeQuery,
    SearchEmployeesQuery
)
from app.domain.sales.employee_repositories import EmployeeRepository, EmployeeSearchResult
from app.domain.sales.employee import Employee
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class EmployeeCommandHandler:
    """Handles employee master data commands."""

    def __init__(self, employee_repository: EmployeeRepository, code_generator=None):
        self._employee_repository = employee_repository

        self._code_generator = code_generator

    async def handle_create_employee(self, command: CreateEmployeeCommand) -> Employee:
        tenant_id = require_tenant_context()
        code_value = command.code

        
        if code_value:
            existing = await self._employee_repository.get_by_code(tenant_id, code_value)
            if existing:
                raise BusinessRuleError(f"Employee code '{code_value}' already exists")
        else:
            if not self._code_generator:
                raise RuntimeError("Code generator service is not configured for Employee")
            code_value = await self._code_generator.generate_code(
                sequence_type="EMP",
                prefix="EMP-",
                digits=6,
                description="Employee code"
            )

        employee = Employee(
            tenant_id=tenant_id,
            code=code_value,
            name=command.name,

        )

        saved = await self._employee_repository.save(employee)
        logger.info("Created employee %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_employee(self, command: UpdateEmployeeCommand) -> Employee:
        tenant_id = require_tenant_context()
        employee = await self._get_employee_or_raise(tenant_id, command.employee_id)

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != employee.code:
                duplicate = await self._employee_repository.get_by_code(tenant_id, normalized_code)
                if duplicate and duplicate.id != employee.id:
                    raise BusinessRuleError(f"Employee code '{normalized_code}' already exists")

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.code is not None:
            update_kwargs['code'] = command.code
        if command.name is not None:
            update_kwargs['name'] = command.name
        employee.update_details(**update_kwargs)

        saved = await self._employee_repository.save(employee)
        logger.info("Updated employee %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_employee(self, command: DeleteEmployeeCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._employee_repository.delete(tenant_id, command.employee_id)

        if not deleted:
            raise NotFoundError(f"Employee {command.employee_id} not found")

        logger.info("Soft deleted employee %s for tenant=%s", command.employee_id, tenant_id)
        return True


    async def _get_employee_or_raise(self, tenant_id: str, employee_id: str) -> Employee:
        if not employee_id or not employee_id.strip():
            raise ValidationError("Employee identifier is required")

        employee = await self._employee_repository.get_by_id(tenant_id, employee_id)
        if not employee:
            raise NotFoundError(f"Employee " + str(employee_id) + " not found")
        return employee


class EmployeeQueryHandler:
    """Handles employee queries."""

    def __init__(self, employee_repository: EmployeeRepository):
        self._employee_repository = employee_repository

    async def handle_get_employee_by_id(self, query: GetEmployeeByIdQuery) -> Employee:
        tenant_id = require_tenant_context()
        employee = await self._employee_repository.get_by_id(tenant_id, query.employee_id)
        if not employee:
            raise NotFoundError(f"Employee {query.employee_id} not found")
        return employee

    async def handle_get_employee_by_code(self, query: GetEmployeeByCodeQuery) -> Employee:
        tenant_id = require_tenant_context()
        employee = await self._employee_repository.get_by_code(tenant_id, query.code)
        if not employee:
            raise NotFoundError(f"Employee code {query.code} not found")
        return employee

    async def handle_search_employees(self, query: SearchEmployeesQuery) -> EmployeeSearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._employee_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )

