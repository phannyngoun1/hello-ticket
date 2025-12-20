"""Repository interface for EventType - Basic CRUD."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.ticketing.event_type import EventType


@dataclass
class EventTypeSearchResult:
    """Result wrapper for event_type search operations"""

    items: List[EventType]
    total: int
    has_next: bool


class EventTypeRepository(ABC):
    """Port for managing event_type master data"""

    @abstractmethod
    async def save(self, event_type: EventType) -> EventType:
        """Persist a event_type (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, event_type_id: str) -> Optional[EventType]:
        """Retrieve event_type by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[EventType]:
        """Retrieve event_type by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> EventTypeSearchResult:
        """Search event_types by term and status"""

    @abstractmethod
    async def get_all(self, tenant_id: str) -> List[EventType]:
        """Get all event_types for a tenant"""

    @abstractmethod
    async def delete(self, tenant_id: str, event_type_id: str, hard_delete: bool = False) -> bool:
        """Delete a event_type.
        
        Args:
            tenant_id: Tenant identifier
            event_type_id: EventType identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

