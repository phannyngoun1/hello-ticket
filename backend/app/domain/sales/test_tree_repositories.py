"""Repository interface for TestTree - Tree/Hierarchical CRUD."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.sales.test_tree import TestTree


@dataclass
class TestTreeSearchResult:
    """Result wrapper for test_tree search operations"""

    items: List[TestTree]
    total: int
    has_next: bool


class TestTreeRepository(ABC):
    """Port for managing test_tree master data with hierarchy support"""

    @abstractmethod
    async def save(self, test_tree: TestTree) -> TestTree:
        """Persist a test_tree (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, test_tree_id: str) -> Optional[TestTree]:
        """Retrieve test_tree by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[TestTree]:
        """Retrieve test_tree by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> TestTreeSearchResult:
        """Search test_trees by term and status"""

    @abstractmethod
    async def get_children(self, parent_test_tree_id: str) -> List[TestTree]:
        """Get all direct children of a test_tree"""

    @abstractmethod
    async def get_descendants(self, test_tree_id: str) -> List[TestTree]:
        """Get all descendants of a test_tree (recursive)"""

    @abstractmethod
    async def get_ancestors(self, test_tree_id: str) -> List[TestTree]:
        """Get all ancestors of a test_tree (up to root)"""

    @abstractmethod
    async def get_root_test_trees(self, tenant_id: str) -> List[TestTree]:
        """Get all root test_trees (no parent)"""

    @abstractmethod
    async def get_all(
        self,
        tenant_id: str,
        parent_test_tree_id: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[TestTree]:
        """Get all test_trees with filters"""

    @abstractmethod
    async def get_test_tree_tree(self, tenant_id: str) -> List[TestTree]:
        """Get full test_tree tree with hierarchy"""

    @abstractmethod
    async def delete(self, tenant_id: str, test_tree_id: str, hard_delete: bool = False) -> bool:
        """Delete test_tree by ID (only if no children).
        
        Args:
            tenant_id: Tenant identifier
            test_tree_id: TestTree identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

