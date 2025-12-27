"""Repository interface for EventSeat - Manages seat status for specific events."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.ticketing.event_seat import EventSeat


@dataclass
class EventSeatSearchResult:
    """Result wrapper for event seat search operations"""
    items: List[EventSeat]
    total: int
    has_next: bool


class EventSeatRepository(ABC):
    """Port for managing event seat inventory"""

    @abstractmethod
    async def save(self, event_seat: EventSeat) -> EventSeat:
        """Persist an event seat (create or update)"""

    @abstractmethod
    async def save_all(self, event_seats: List[EventSeat]) -> List[EventSeat]:
        """Persist multiple event seats (bulk create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, event_seat_id: str) -> Optional[EventSeat]:
        """Retrieve event seat by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_event(
        self,
        tenant_id: str,
        event_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> EventSeatSearchResult:
        """Get seats for a specific event with pagination"""

    @abstractmethod
    async def delete_by_event(self, tenant_id: str, event_id: str) -> int:
        """Delete all seats for an event. Returns count of deleted seats."""

    @abstractmethod
    async def get_seat_by_location(
        self,
        tenant_id: str,
        event_id: str,
        section_name: str,
        row_name: str,
        seat_number: str
    ) -> Optional[EventSeat]:
        """Find a specific seat by layout location for an event"""
