"""Repository interface for Event - Basic CRUD."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.ticketing.event import Event


@dataclass
class EventSearchResult:
    """Result wrapper for event search operations"""

    items: List[Event]
    total: int
    has_next: bool


class EventRepository(ABC):
    """Port for managing event master data"""

    @abstractmethod
    async def save(self, event: Event) -> Event:
        """Persist a event (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, event_id: str) -> Optional[Event]:
        """Retrieve event by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Event]:
        """Retrieve event by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        show_id: Optional[str] = None,
        layout_id: Optional[str] = None,
        status: Optional[List[str]] = None,
        skip: int = 0,
        limit: int = 50,
        sort_by: str = "start_dt",
        sort_order: str = "asc",
    ) -> EventSearchResult:
        """Search events by term and status"""

    @abstractmethod
    async def get_all(self, tenant_id: str) -> List[Event]:
        """Get all events for a tenant"""

    @abstractmethod
    async def delete(self, tenant_id: str, event_id: str, hard_delete: bool = False) -> bool:
        """Delete a event.
        
        Args:
            tenant_id: Tenant identifier
            event_id: Event identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

