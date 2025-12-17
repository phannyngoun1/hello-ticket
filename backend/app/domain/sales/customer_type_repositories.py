"""Repository interface for CustomerType - Basic CRUD."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.sales.customer_type import CustomerType


@dataclass
class CustomerTypeSearchResult:
    """Result wrapper for customer_type search operations"""

    items: List[CustomerType]
    total: int
    has_next: bool


class CustomerTypeRepository(ABC):
    """Port for managing customer_type master data"""

    @abstractmethod
    async def save(self, customer_type: CustomerType) -> CustomerType:
        """Persist a customer_type (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, customer_type_id: str) -> Optional[CustomerType]:
        """Retrieve customer_type by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[CustomerType]:
        """Retrieve customer_type by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> CustomerTypeSearchResult:
        """Search customer_types by term and status"""

    @abstractmethod
    async def get_all(self, tenant_id: str) -> List[CustomerType]:
        """Get all customer_types for a tenant"""

    @abstractmethod
    async def delete(self, tenant_id: str, customer_type_id: str, hard_delete: bool = False) -> bool:
        """Delete a customer_type.
        
        Args:
            tenant_id: Tenant identifier
            customer_type_id: CustomerType identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

