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

            # System Link
            user_id=employee.user_id,
            work_email=employee.work_email,

            # Organizational Structure
            job_title=employee.job_title,
            department=employee.department,
            manager_id=employee.manager_id,
            employment_type=employee.employment_type,
            hire_date=employee.hire_date,

            # Contact & Location
            work_phone=employee.work_phone,
            mobile_phone=employee.mobile_phone,
            office_location=employee.office_location,
            timezone=employee.timezone,

            # Sales & Operational
            skills=employee.skills,
            assigned_territories=employee.assigned_territories,
            quota_config=employee.quota_config,
            commission_tier=employee.commission_tier,

            # Personal (HR)
            birthday=employee.birthday,
            emergency_contact_name=employee.emergency_contact_name,
            emergency_contact_phone=employee.emergency_contact_phone,
            emergency_contact_relationship=employee.emergency_contact_relationship,

            is_active=employee.is_active,
            created_at=employee.created_at,
            updated_at=employee.updated_at,
            deactivated_at=employee.deactivated_at,
        )

