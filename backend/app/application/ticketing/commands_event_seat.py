"""
Commands for EventSeat module.
"""
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
@dataclass
class InitializeEventSeatsCommand:
    """Command to generate EventSeat records from a Layout"""
    event_id: str
    tenant_id: str


@dataclass
class BrokerSeatImportItem:
    """Item for broker seat import"""
    section_name: str
    row_name: str
    seat_number: str
    price: float = 0.0
    ticket_code: Optional[str] = None
    attributes: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ImportBrokerSeatsCommand:
    """Command to import seats from a broker list"""
    event_id: str
    tenant_id: str
    broker_id: str
    seats: List[BrokerSeatImportItem]


@dataclass
class DeleteEventSeatsCommand:
    """Command to delete specific event seats"""
    event_id: str
    tenant_id: str
    event_seat_ids: List[str]
