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

        # Convert string dates to date objects if provided
        hire_date_obj = None
        if command.hire_date:
            from datetime import datetime
            hire_date_obj = datetime.fromisoformat(command.hire_date).date()

        birthday_obj = None
        if command.birthday:
            from datetime import datetime
            birthday_obj = datetime.fromisoformat(command.birthday).date()

        employee = Employee(
            tenant_id=tenant_id,
            code=code_value,
            name=command.name,

            # System Link
            user_id=command.user_id,
            work_email=command.work_email,

            # Organizational Structure
            job_title=command.job_title,
            department=command.department,
            manager_id=command.manager_id,
            employment_type=command.employment_type,
            hire_date=hire_date_obj,

            # Contact & Location
            work_phone=command.work_phone,
            mobile_phone=command.mobile_phone,
            office_location=command.office_location,
            employee_timezone=command.timezone or "UTC",

            # Sales & Operational
            skills=command.skills,
            assigned_territories=command.assigned_territories,
            quota_config=command.quota_config,
            commission_tier=command.commission_tier,

            # Personal (HR)
            birthday=birthday_obj,
            emergency_contact_name=command.emergency_contact_name,
            emergency_contact_phone=command.emergency_contact_phone,
            emergency_contact_relationship=command.emergency_contact_relationship,
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

        # Convert string dates to date objects if provided
        hire_date_obj = None
        if command.hire_date:
            from datetime import datetime
            hire_date_obj = datetime.fromisoformat(command.hire_date).date()

        birthday_obj = None
        if command.birthday:
            from datetime import datetime
            birthday_obj = datetime.fromisoformat(command.birthday).date()

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.code is not None:
            update_kwargs['code'] = command.code
        if command.name is not None:
            update_kwargs['name'] = command.name

        # System Link
        if command.user_id is not None:
            update_kwargs['user_id'] = command.user_id
        if command.work_email is not None:
            update_kwargs['work_email'] = command.work_email

        # Organizational Structure
        if command.job_title is not None:
            update_kwargs['job_title'] = command.job_title
        if command.department is not None:
            update_kwargs['department'] = command.department
        if command.manager_id is not None:
            update_kwargs['manager_id'] = command.manager_id
        if command.employment_type is not None:
            update_kwargs['employment_type'] = command.employment_type
        if command.hire_date is not None:
            update_kwargs['hire_date'] = hire_date_obj

        # Contact & Location
        if command.work_phone is not None:
            update_kwargs['work_phone'] = command.work_phone
        if command.mobile_phone is not None:
            update_kwargs['mobile_phone'] = command.mobile_phone
        if command.office_location is not None:
            update_kwargs['office_location'] = command.office_location
        if command.timezone is not None:
            update_kwargs['employee_timezone'] = command.timezone

        # Sales & Operational
        if command.skills is not None:
            update_kwargs['skills'] = command.skills
        if command.assigned_territories is not None:
            update_kwargs['assigned_territories'] = command.assigned_territories
        if command.quota_config is not None:
            update_kwargs['quota_config'] = command.quota_config
        if command.commission_tier is not None:
            update_kwargs['commission_tier'] = command.commission_tier

        # Personal (HR)
        if command.birthday is not None:
            update_kwargs['birthday'] = birthday_obj
        if command.emergency_contact_name is not None:
            update_kwargs['emergency_contact_name'] = command.emergency_contact_name
        if command.emergency_contact_phone is not None:
            update_kwargs['emergency_contact_phone'] = command.emergency_contact_phone
        if command.emergency_contact_relationship is not None:
            update_kwargs['emergency_contact_relationship'] = command.emergency_contact_relationship

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

