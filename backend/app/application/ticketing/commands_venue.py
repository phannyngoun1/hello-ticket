"""Ticketing commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateVenueCommand:
    """Command to create a new venue"""

    name: str
    code: Optional[str] = None


@dataclass
class UpdateVenueCommand:
    """Command to update venue details"""

    venue_id: str
    name: Optional[str] = None
    code: Optional[str] = None
    image_url: Optional[str] = None


@dataclass
class DeleteVenueCommand:
    """Command to remove a venue (soft-delete only)"""

    venue_id: str



