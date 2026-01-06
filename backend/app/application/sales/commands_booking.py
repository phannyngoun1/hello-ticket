"""Sales commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional, List, Dict, Any


@dataclass
class BookingItemCommand:
    """Booking item command"""
    event_seat_id: str
    section_name: Optional[str] = None
    row_name: Optional[str] = None
    seat_number: Optional[str] = None
    unit_price: float = 0.0
    total_price: float = 0.0
    currency: str = "USD"
    ticket_number: Optional[str] = None
    ticket_status: Optional[str] = None


@dataclass
class CreateBookingCommand:
    """Command to create a new booking"""
    event_id: str
    items: List[BookingItemCommand]
    customer_id: Optional[str] = None
    salesperson_id: Optional[str] = None,
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    tax_rate: float = 0.0
    currency: str = "USD"


@dataclass
class UpdateBookingCommand:
    """Command to update booking details"""
    booking_id: str
    customer_id: Optional[str] = None
    salesperson_id: Optional[str] = None
    status: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    payment_status: Optional[str] = None


@dataclass
class DeleteBookingCommand:
    """Command to remove a booking (soft-delete only)"""

    booking_id: str
    cancellation_reason: str



