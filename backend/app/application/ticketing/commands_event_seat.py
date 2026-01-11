"""
Commands for EventSeat module.
"""
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


@dataclass
class SectionPricingConfig:
    """Configuration for section-based pricing"""
    section_id: str
    price: float


@dataclass
class SeatPricingConfig:
    """Configuration for individual seat pricing (overrides section price)"""
    seat_id: str
    price: float


@dataclass
class InitializeEventSeatsCommand:
    """Command to generate EventSeat records from a Layout"""
    event_id: str
    tenant_id: str
    generate_tickets: bool = False  # If True, create tickets for all seats
    ticket_price: float = 0.0  # Default price for tickets if generate_tickets is True (used when section_pricing is not provided)
    pricing_mode: str = "same"  # "same" for same price for all, "per_section" for different prices per section
    section_pricing: Optional[List[SectionPricingConfig]] = None  # Per-section pricing configuration
    seat_pricing: Optional[List[SeatPricingConfig]] = None  # Individual seat pricing overrides
    included_section_ids: Optional[List[str]] = None  # List of section IDs to include
    excluded_section_ids: Optional[List[str]] = None  # List of section IDs to exclude


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


@dataclass
class HoldEventSeatsCommand:
    """Command to hold event seats with a reason"""
    event_id: str
    tenant_id: str
    event_seat_ids: List[str]
    reason: Optional[str] = None


@dataclass
class BlockEventSeatsCommand:
    """Command to block event seats with a reason"""
    event_id: str
    tenant_id: str
    event_seat_ids: List[str]
    reason: Optional[str] = None
