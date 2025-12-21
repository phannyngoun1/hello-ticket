"""Repository interface for Show - Advanced CRUD."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Dict, Any

from app.domain.ticketing.show import Show


@dataclass
class ShowSearchResult:
    """Result wrapper for show search operations"""

    items: List[Show]
    total: int
    has_next: bool


class ShowRepository(ABC):
    """Port for managing show master data with advanced features"""

    @abstractmethod
    async def save(self, show: Show) -> Show:
        """Persist a show (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, show_id: str) -> Optional[Show]:
        """Retrieve show by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Show]:
        """Retrieve show by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> ShowSearchResult:
        """Search shows by term and status with advanced filters"""

    @abstractmethod
    async def get_all(self, tenant_id: str) -> List[Show]:
        """Get all shows for a tenant"""

    @abstractmethod
    async def delete(self, tenant_id: str, show_id: str, hard_delete: bool = False) -> bool:
        """Delete a show.
        
        Args:
            tenant_id: Tenant identifier
            show_id: Show identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

