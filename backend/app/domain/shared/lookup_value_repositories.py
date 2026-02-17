"""Lookup value repository interface."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.shared.lookup_value import LookupValue


@dataclass
class LookupSearchResult:
    """Result wrapper for lookup search operations."""

    items: List[LookupValue]
    total: int
    has_next: bool


class LookupRepository(ABC):
    """Port for managing lookup/reference data."""

    @abstractmethod
    async def save(self, lookup: LookupValue) -> LookupValue:
        """Persist a lookup (create or update)."""
        pass

    @abstractmethod
    async def get_by_id(
        self, tenant_id: str, lookup_id: str, type_code: str
    ) -> Optional[LookupValue]:
        """Retrieve lookup by identifier scoped to tenant and type."""
        pass

    @abstractmethod
    async def get_by_code(
        self, tenant_id: str, code: str, type_code: str
    ) -> Optional[LookupValue]:
        """Retrieve lookup by business code."""
        pass

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        type_code: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        include_deleted: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> LookupSearchResult:
        """Search lookups by term and status."""
        pass

    @abstractmethod
    async def delete(
        self, tenant_id: str, lookup_id: str, type_code: str, hard_delete: bool = False
    ) -> bool:
        """Delete a lookup (soft by default)."""
        pass
