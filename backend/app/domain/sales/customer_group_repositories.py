"""Repository interface for CustomerGroup - Tree/Hierarchical CRUD."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.sales.customer_group import CustomerGroup


@dataclass
class CustomerGroupSearchResult:
    """Result wrapper for customer_group search operations"""

    items: List[CustomerGroup]
    total: int
    has_next: bool


class CustomerGroupRepository(ABC):
    """Port for managing customer_group master data with hierarchy support"""

    @abstractmethod
    async def save(self, customer_group: CustomerGroup) -> CustomerGroup:
        """Persist a customer_group (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, customer_group_id: str) -> Optional[CustomerGroup]:
        """Retrieve customer_group by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[CustomerGroup]:
        """Retrieve customer_group by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> CustomerGroupSearchResult:
        """Search customer_groups by term and status"""

    @abstractmethod
    async def get_children(self, parent_id: str) -> List[CustomerGroup]:
        """Get all direct children of a customer_group"""

    @abstractmethod
    async def get_descendants(self, customer_group_id: str) -> List[CustomerGroup]:
        """Get all descendants of a customer_group (recursive)"""

    @abstractmethod
    async def get_ancestors(self, customer_group_id: str) -> List[CustomerGroup]:
        """Get all ancestors of a customer_group (up to root)"""

    @abstractmethod
    async def get_root_customer_groups(self, tenant_id: str) -> List[CustomerGroup]:
        """Get all root customer_groups (no parent)"""

    @abstractmethod
    async def get_all(
        self,
        tenant_id: str,
        parent_id: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[CustomerGroup]:
        """Get all customer_groups with filters"""

    @abstractmethod
    async def get_customer_group_tree(self, tenant_id: str) -> List[CustomerGroup]:
        """Get full customer_group tree with hierarchy"""

    @abstractmethod
    async def delete(self, tenant_id: str, customer_group_id: str, hard_delete: bool = False) -> bool:
        """Delete customer_group by ID (only if no children).
        
        Args:
            tenant_id: Tenant identifier
            customer_group_id: CustomerGroup identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

