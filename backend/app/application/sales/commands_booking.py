"""Sales commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateBookingCommand:
    """Command to create a new booking"""

    name: str
    code: Optional[str] = None


@dataclass
class UpdateBookingCommand:
    """Command to update booking details"""

    booking_id: str
    name: Optional[str] = None
    code: Optional[str] = None


@dataclass
class DeleteBookingCommand:
    """Command to remove a booking (soft-delete only)"""

    booking_id: str



