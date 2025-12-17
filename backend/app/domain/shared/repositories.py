"""Repository interfaces for shared domain objects"""
from abc import ABC, abstractmethod
from typing import Optional, List

from app.domain.shared.sequence import Sequence
from app.domain.shared.address import Address
from app.domain.shared.address_assignment import AddressAssignment


class AddressRepository(ABC):
    """Port for managing addresses"""

    @abstractmethod
    async def save(self, address: Address) -> Address:
        """Save or update an address"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, address_id: str) -> Optional[Address]:
        """Get address by ID"""

    @abstractmethod
    async def list(
        self,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Address]:
        """List addresses with pagination"""

    @abstractmethod
    async def find_by_fields(
        self,
        tenant_id: str,
        street: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        postal_code: Optional[str] = None,
        country: Optional[str] = None,
    ) -> Optional[Address]:
        """Find an existing address by its fields"""

    @abstractmethod
    async def delete(self, tenant_id: str, address_id: str) -> bool:
        """Delete an address"""


class AddressAssignmentRepository(ABC):
    """Port for managing address assignments"""

    @abstractmethod
    async def save(self, assignment: AddressAssignment) -> AddressAssignment:
        """Save or update an address assignment"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, assignment_id: str) -> Optional[AddressAssignment]:
        """Get address assignment by ID"""

    @abstractmethod
    async def get_by_address_and_entity(
        self,
        tenant_id: str,
        address_id: str,
        entity_type: str,
        entity_id: str,
        address_type: Optional[str] = None,
    ) -> Optional[AddressAssignment]:
        """Get address assignment by address and entity"""

    @abstractmethod
    async def list_by_entity(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
        address_type: Optional[str] = None,
    ) -> List[AddressAssignment]:
        """List address assignments for an entity"""

    @abstractmethod
    async def list_by_address(
        self,
        tenant_id: str,
        address_id: str,
    ) -> List[AddressAssignment]:
        """List address assignments for an address"""

    @abstractmethod
    async def get_primary(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
        address_type: str,
    ) -> Optional[AddressAssignment]:
        """Get primary address assignment for an entity and type"""

    @abstractmethod
    async def delete(self, tenant_id: str, assignment_id: str) -> bool:
        """Delete an address assignment"""

    @abstractmethod
    async def delete_by_address_and_entity(
        self,
        tenant_id: str,
        address_id: str,
        entity_type: str,
        entity_id: str,
        address_type: Optional[str] = None,
    ) -> bool:
        """Delete address assignments by address and entity"""


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
