"""Sales queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class GetBookingByIdQuery:
    """Query to retrieve a booking by identifier."""

    booking_id: str


@dataclass
class GetBookingByCodeQuery:
    """Query to retrieve a booking by business code."""

    code: str


@dataclass
class SearchBookingsQuery:
    """Query to search bookings with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50

