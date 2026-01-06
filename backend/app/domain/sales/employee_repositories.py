"""Repository interface for Employee - Advanced CRUD."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Dict, Any

from app.domain.sales.employee import Employee


@dataclass
class EmployeeSearchResult:
    """Result wrapper for employee search operations"""

    items: List[Employee]
    total: int
    has_next: bool


class EmployeeRepository(ABC):
    """Port for managing employee master data with advanced features"""

    @abstractmethod
    async def save(self, employee: Employee) -> Employee:
        """Persist a employee (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, employee_id: str) -> Optional[Employee]:
        """Retrieve employee by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Employee]:
        """Retrieve employee by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> EmployeeSearchResult:
        """Search employees by term and status with advanced filters"""

    @abstractmethod
    async def get_all(self, tenant_id: str) -> List[Employee]:
        """Get all employees for a tenant"""

    @abstractmethod
    async def delete(self, tenant_id: str, employee_id: str, hard_delete: bool = False) -> bool:
        """Delete a employee.
        
        Args:
            tenant_id: Tenant identifier
            employee_id: Employee identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

