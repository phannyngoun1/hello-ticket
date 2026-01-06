"""Ticketing commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateOrganizerCommand:
    """Command to create a new organizer"""

    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    logo: Optional[str] = None
    tags: Optional[list[str]] = None


@dataclass
class UpdateOrganizerCommand:
    """Command to update organizer details"""

    organizer_id: str
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    logo: Optional[str] = None
    tags: Optional[list[str]] = None


@dataclass
class DeleteOrganizerCommand:
    """Command to remove a organizer (soft-delete only)"""

    organizer_id: str



