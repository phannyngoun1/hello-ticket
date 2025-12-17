"""
Serial entity for inventory tracking
"""
from typing import Optional
from enum import Enum
from app.shared.utils import generate_id


class SerialStatus(Enum):
    """Serial status enumeration"""
    AVAILABLE = "available"
    IN_USE = "in_use"
    RESERVED = "reserved"
    SCRAPPED = "scrapped"


class Serial:
    """Serial entity for unique item tracking"""
    
    def __init__(
        self,
        serial_id: Optional[str] = None,
        tenant_id: str = None,
        item_id: str = None,
        serial_number: str = None,
        status: SerialStatus = SerialStatus.AVAILABLE
    ):
        self.id = serial_id or generate_id()
        self.tenant_id = tenant_id
        self.item_id = item_id
        self.serial_number = serial_number
        self.status = status
    
    def is_available(self) -> bool:
        """Check if serial is available for use"""
        return self.status == SerialStatus.AVAILABLE
    
    def reserve(self) -> None:
        """Reserve serial"""
        if not self.is_available():
            raise ValueError(f"Serial {self.serial_number} is not available")
        self.status = SerialStatus.RESERVED
    
    def use(self) -> None:
        """Mark serial as in use"""
        if self.status != SerialStatus.RESERVED:
            raise ValueError(f"Serial {self.serial_number} must be reserved before use")
        self.status = SerialStatus.IN_USE
    
    def release(self) -> None:
        """Release serial back to available"""
        if self.status in [SerialStatus.RESERVED, SerialStatus.IN_USE]:
            self.status = SerialStatus.AVAILABLE
    
    def scrap(self) -> None:
        """Mark serial as scrapped"""
        self.status = SerialStatus.SCRAPPED
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Serial):
            return False
        return self.id == other.id
    
    def __hash__(self) -> int:
        return hash(self.id)

