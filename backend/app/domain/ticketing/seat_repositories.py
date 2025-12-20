"""Repository interface for Seat - CRUD operations."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.ticketing.seat import Seat


@dataclass
class SeatSearchResult:
    """Result wrapper for seat search operations"""

    items: List[Seat]
    total: int
    has_next: bool


class SeatRepository(ABC):
    """Port for managing seat master data"""

    @abstractmethod
    async def save(self, seat: Seat) -> Seat:
        """Persist a seat (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, seat_id: str) -> Optional[Seat]:
        """Retrieve seat by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_venue(
        self,
        tenant_id: str,
        venue_id: str,
        skip: int = 0,
        limit: int = 1000,
    ) -> SeatSearchResult:
        """Retrieve all seats for a venue"""

    @abstractmethod
    async def get_by_venue_and_location(
        self,
        tenant_id: str,
        venue_id: str,
        section: str,
        row: str,
        seat_number: str,
    ) -> Optional[Seat]:
        """Retrieve seat by venue and location (section, row, seat_number)"""

    @abstractmethod
    async def delete(self, tenant_id: str, seat_id: str, hard_delete: bool = False) -> bool:
        """Delete a seat.
        
        Args:
            tenant_id: Tenant identifier
            seat_id: Seat identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

    @abstractmethod
    async def delete_by_venue(self, tenant_id: str, venue_id: str) -> int:
        """Delete all seats for a venue.
        
        Returns:
            Number of seats deleted
        """
