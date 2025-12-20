"""Ticketing seat commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional
from app.domain.ticketing.seat import SeatType


@dataclass
class CreateSeatCommand:
    """Command to create a new seat"""

    venue_id: str
    section: str
    row: str
    seat_number: str
    seat_type: SeatType = SeatType.STANDARD
    x_coordinate: Optional[float] = None
    y_coordinate: Optional[float] = None


@dataclass
class UpdateSeatCommand:
    """Command to update seat details"""

    seat_id: str
    section: Optional[str] = None
    row: Optional[str] = None
    seat_number: Optional[str] = None
    seat_type: Optional[SeatType] = None
    x_coordinate: Optional[float] = None
    y_coordinate: Optional[float] = None


@dataclass
class UpdateSeatCoordinatesCommand:
    """Command to update seat coordinates for seat map"""

    seat_id: str
    x_coordinate: float
    y_coordinate: float


@dataclass
class DeleteSeatCommand:
    """Command to remove a seat (soft-delete only)"""

    seat_id: str


@dataclass
class BulkCreateSeatsCommand:
    """Command to create multiple seats at once"""

    venue_id: str
    seats: list[dict]  # List of seat data dictionaries


@dataclass
class DeleteSeatsByVenueCommand:
    """Command to delete all seats for a venue"""

    venue_id: str
