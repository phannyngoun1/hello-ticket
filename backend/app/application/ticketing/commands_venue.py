"""Ticketing commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateVenueCommand:
    """Command to create a new venue"""

    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    venue_type: Optional[str] = None
    capacity: Optional[int] = None
    parking_info: Optional[str] = None
    accessibility: Optional[str] = None
    amenities: Optional[list] = None
    opening_hours: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None


@dataclass
class UpdateVenueCommand:
    """Command to update venue details"""

    venue_id: str
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    venue_type: Optional[str] = None
    capacity: Optional[int] = None
    parking_info: Optional[str] = None
    accessibility: Optional[str] = None
    amenities: Optional[list] = None
    opening_hours: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None


@dataclass
class DeleteVenueCommand:
    """Command to remove a venue (soft-delete only)"""

    venue_id: str



