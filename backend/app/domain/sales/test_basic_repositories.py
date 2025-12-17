"""Repository interface for TestBasic - Basic CRUD."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.sales.test_basic import TestBasic


@dataclass
class TestBasicSearchResult:
    """Result wrapper for test_basic search operations"""

    items: List[TestBasic]
    total: int
    has_next: bool


class TestBasicRepository(ABC):
    """Port for managing test_basic master data"""

    @abstractmethod
    async def save(self, test_basic: TestBasic) -> TestBasic:
        """Persist a test_basic (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, test_basic_id: str) -> Optional[TestBasic]:
        """Retrieve test_basic by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[TestBasic]:
        """Retrieve test_basic by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> TestBasicSearchResult:
        """Search test_basics by term and status"""

    @abstractmethod
    async def get_all(self, tenant_id: str) -> List[TestBasic]:
        """Get all test_basics for a tenant"""

    @abstractmethod
    async def delete(self, tenant_id: str, test_basic_id: str, hard_delete: bool = False) -> bool:
        """Delete a test_basic.
        
        Args:
            tenant_id: Tenant identifier
            test_basic_id: TestBasic identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

