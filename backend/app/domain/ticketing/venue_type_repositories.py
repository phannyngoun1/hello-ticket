"""Repository interface for VenueType - Basic CRUD."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.ticketing.venue_type import VenueType


@dataclass
class VenueTypeSearchResult:
    """Result wrapper for venue_type search operations"""

    items: List[VenueType]
    total: int
    has_next: bool


class VenueTypeRepository(ABC):
    """Port for managing venue_type master data"""

    @abstractmethod
    async def save(self, venue_type: VenueType) -> VenueType:
        """Persist a venue_type (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, venue_type_id: str) -> Optional[VenueType]:
        """Retrieve venue_type by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[VenueType]:
        """Retrieve venue_type by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> VenueTypeSearchResult:
        """Search venue_types by term and status"""

    @abstractmethod
    async def get_all(self, tenant_id: str) -> List[VenueType]:
        """Get all venue_types for a tenant"""

    @abstractmethod
    async def delete(self, tenant_id: str, venue_type_id: str, hard_delete: bool = False) -> bool:
        """Delete a venue_type.
        
        Args:
            tenant_id: Tenant identifier
            venue_type_id: VenueType identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

