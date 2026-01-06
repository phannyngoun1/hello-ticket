"""API mapper for Sales module"""
from app.domain.sales.employee import Employee
from app.presentation.api.sales.schemas_employee import EmployeeResponse


class SalesApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def employee_to_response(employee: Employee) -> EmployeeResponse:
        return EmployeeResponse(
            id=employee.id,
            tenant_id=employee.tenant_id,
            code=employee.code,
            name=employee.name,

            is_active=employee.is_active,
            created_at=employee.created_at,
            updated_at=employee.updated_at,
            deactivated_at=employee.deactivated_at,
        )

