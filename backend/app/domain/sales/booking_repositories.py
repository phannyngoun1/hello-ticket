"""Repository interface for Booking - Advanced CRUD."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Dict, Any

from app.domain.sales.booking import Booking


@dataclass
class BookingSearchResult:
    """Result wrapper for booking search operations"""

    items: List[Booking]
    total: int
    has_next: bool


class BookingRepository(ABC):
    """Port for managing booking master data with advanced features"""

    @abstractmethod
    async def save(self, booking: Booking) -> Booking:
        """Persist a booking (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, booking_id: str) -> Optional[Booking]:
        """Retrieve booking by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Booking]:
        """Retrieve booking by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> BookingSearchResult:
        """Search bookings by term and status with advanced filters"""

    @abstractmethod
    async def get_all(self, tenant_id: str) -> List[Booking]:
        """Get all bookings for a tenant"""

    @abstractmethod
    async def delete(self, tenant_id: str, booking_id: str, hard_delete: bool = False) -> bool:
        """Delete a booking.
        
        Args:
            tenant_id: Tenant identifier
            booking_id: Booking identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

