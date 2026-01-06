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
            is_active=employee.is_active,
            version=employee.get_version(),
            created_at=employee.created_at,
            updated_at=employee.updated_at,
        )

