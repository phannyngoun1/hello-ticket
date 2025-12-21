"""Repository interfaces for shared domain objects"""
from abc import ABC, abstractmethod
from typing import Optional, List

from app.domain.shared.sequence import Sequence


class SequenceRepository(ABC):
    """Port for managing sequence counters"""

    @abstractmethod
    async def get_by_type(
        self, tenant_id: str, sequence_type: str
    ) -> Optional[Sequence]:
        """Get sequence by type for a tenant"""

    @abstractmethod
    async def get_or_create(
        self,
        tenant_id: str,
        sequence_type: str,
        prefix: str = "",
        digits: int = 6,
        description: Optional[str] = None,
    ) -> Sequence:
        """Get existing sequence or create a new one with default values"""

    @abstractmethod
    async def save(self, sequence: Sequence) -> Sequence:
        """Save or update a sequence"""

    @abstractmethod
    async def get_next_value(
        self,
        tenant_id: str,
        sequence_type: str,
        prefix: str = "",
        digits: int = 6,
    ) -> str:
        """Get the next code value (thread-safe, increments counter)"""
