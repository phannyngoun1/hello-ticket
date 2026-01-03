"""Ticketing commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateVenueTypeCommand:
    """Command to create a new venue_type"""

    name: str
    code: str


@dataclass
class UpdateVenueTypeCommand:
    """Command to update venue_type details"""

    venue_type_id: str
    name: Optional[str] = None
    code: Optional[str] = None


@dataclass
class DeleteVenueTypeCommand:
    """Command to remove a venue_type (soft-delete only)"""

    venue_type_id: str



