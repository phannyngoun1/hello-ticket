"""Repository interface for Venue - Advanced CRUD."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Dict, Any

from app.domain.ticketing.venue import Venue


@dataclass
class VenueSearchResult:
    """Result wrapper for venue search operations"""

    items: List[Venue]
    total: int
    has_next: bool


class VenueRepository(ABC):
    """Port for managing venue master data with advanced features"""

    @abstractmethod
    async def save(self, venue: Venue) -> Venue:
        """Persist a venue (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, venue_id: str) -> Optional[Venue]:
        """Retrieve venue by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Venue]:
        """Retrieve venue by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> VenueSearchResult:
        """Search venues by term and status with advanced filters"""

    @abstractmethod
    async def get_all(self, tenant_id: str) -> List[Venue]:
        """Get all venues for a tenant"""

    @abstractmethod
    async def delete(self, tenant_id: str, venue_id: str, hard_delete: bool = False) -> bool:
        """Delete a venue.
        
        Args:
            tenant_id: Tenant identifier
            venue_id: Venue identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

