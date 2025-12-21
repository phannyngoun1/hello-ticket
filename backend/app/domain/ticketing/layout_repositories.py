"""Repository interfaces for Layout aggregate."""
from abc import ABC, abstractmethod
from typing import Optional, List

from app.domain.ticketing.layout import Layout


class LayoutRepository(ABC):
    """Repository interface for Layout aggregate."""

    @abstractmethod
    async def save(self, layout: Layout) -> Layout:
        """Save or update a layout."""
        pass

    @abstractmethod
    async def get_by_id(self, tenant_id: str, layout_id: str) -> Optional[Layout]:
        """Get layout by ID."""
        pass

    @abstractmethod
    async def get_by_venue_id(self, tenant_id: str, venue_id: str) -> List[Layout]:
        """Get all layouts for a venue."""
        pass

    @abstractmethod
    async def delete(self, tenant_id: str, layout_id: str) -> None:
        """Delete a layout (soft delete)."""
        pass
