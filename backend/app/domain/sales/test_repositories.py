"""Repository interface for Test - Advanced CRUD."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Dict, Any

from app.domain.sales.test import Test


@dataclass
class TestSearchResult:
    """Result wrapper for test search operations"""

    items: List[Test]
    total: int
    has_next: bool


class TestRepository(ABC):
    """Port for managing test master data with advanced features"""

    @abstractmethod
    async def save(self, test: Test) -> Test:
        """Persist a test (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, test_id: str) -> Optional[Test]:
        """Retrieve test by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Test]:
        """Retrieve test by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> TestSearchResult:
        """Search tests by term and status with advanced filters"""

    @abstractmethod
    async def get_all(self, tenant_id: str) -> List[Test]:
        """Get all tests for a tenant"""

    @abstractmethod
    async def delete(self, tenant_id: str, test_id: str, hard_delete: bool = False) -> bool:
        """Delete a test.
        
        Args:
            tenant_id: Tenant identifier
            test_id: Test identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

