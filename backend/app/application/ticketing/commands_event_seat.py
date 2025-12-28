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
    generate_tickets: bool = False  # If True, create tickets for all seats
    ticket_price: float = 0.0  # Price for tickets if generate_tickets is True


@dataclass
class BrokerSeatImportItem:
    """Item for broker seat import"""
    section_name: str
    row_name: str
    seat_number: str
    # Note: price and ticket_code are metadata for import but not stored on EventSeat
    # Tickets should be created separately with price information
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


@dataclass
class CreateTicketsFromSeatsCommand:
    """Command to create tickets from event seats"""
    event_id: str
    tenant_id: str
    event_seat_ids: List[str]
    ticket_price: float = 0.0  # Price for tickets (applied to all)


@dataclass
class CreateEventSeatCommand:
    """Command to create a single event seat"""
    event_id: str
    tenant_id: str
    seat_id: Optional[str] = None
    section_name: Optional[str] = None
    row_name: Optional[str] = None
    seat_number: Optional[str] = None
    broker_id: Optional[str] = None
    create_ticket: bool = False  # If True, create ticket immediately
    ticket_price: float = 0.0  # Price for ticket if create_ticket is True
    ticket_number: Optional[str] = None  # Optional ticket number if create_ticket is True
    attributes: Dict[str, Any] = field(default_factory=dict)
