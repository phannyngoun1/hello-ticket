"""Repository interface for Organizer - Advanced CRUD."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Dict, Any

from app.domain.ticketing.organizer import Organizer


@dataclass
class OrganizerSearchResult:
    """Result wrapper for organizer search operations"""

    items: List[Organizer]
    total: int
    has_next: bool


class OrganizerRepository(ABC):
    """Port for managing organizer master data with advanced features"""

    @abstractmethod
    async def save(self, organizer: Organizer) -> Organizer:
        """Persist a organizer (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, organizer_id: str) -> Optional[Organizer]:
        """Retrieve organizer by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_ids(self, tenant_id: str, organizer_ids: List[str]) -> List[Organizer]:
        """Retrieve multiple organizers by identifiers"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Organizer]:
        """Retrieve organizer by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> OrganizerSearchResult:
        """Search organizers by term and status with advanced filters"""

    @abstractmethod
    async def get_all(self, tenant_id: str) -> List[Organizer]:
        """Get all organizers for a tenant"""

    @abstractmethod
    async def delete(self, tenant_id: str, organizer_id: str, hard_delete: bool = False) -> bool:
        """Delete a organizer.
        
        Args:
            tenant_id: Tenant identifier
            organizer_id: Organizer identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

