"""
Employee mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.sales.employee import Employee
from app.infrastructure.shared.database.models import EmployeeModel


class EmployeeMapper:
    """Mapper for Employee entity to EmployeeModel conversion"""
    
    @staticmethod
    def to_domain(model: EmployeeModel) -> Employee:
        """Convert database model to domain entity
        
        Args:
            model: EmployeeModel from database
            
        Returns:
            Employee domain entity
        """
        return Employee(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            employee_id=model.id,
            # System Link
            user_id=model.user_id,
            work_email=model.work_email,
            # Organizational Structure
            job_title=model.job_title,
            department=model.department,
            manager_id=model.manager_id,
            employment_type=model.employment_type,
            hire_date=model.hire_date,
            # Contact & Location
            work_phone=model.work_phone,
            mobile_phone=model.mobile_phone,
            office_location=model.office_location,
            employee_timezone=model.timezone,
            # Sales & Operational
            skills=model.skills,
            assigned_territories=model.assigned_territories,
            quota_config=model.quota_config,
            commission_tier=model.commission_tier,
            # Personal (HR)
            birthday=model.birthday,
            emergency_contact_name=model.emergency_contact_name,
            emergency_contact_phone=model.emergency_contact_phone,
            emergency_contact_relationship=model.emergency_contact_relationship,
            # System fields
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    @staticmethod
    def to_model(employee: Employee) -> EmployeeModel:
        """Convert domain entity to database model
        
        Args:
            employee: Employee domain entity
            
        Returns:
            EmployeeModel for database persistence
        """
        return EmployeeModel(
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
            # System fields
            is_active=employee.is_active,
            version=employee.get_version(),
            created_at=employee.created_at,
            updated_at=employee.updated_at,
        )


