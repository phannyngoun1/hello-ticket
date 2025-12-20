"""Ticketing commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateOrganizerCommand:
    """Command to create a new organizer"""

    name: str
    code: Optional[str] = None


@dataclass
class UpdateOrganizerCommand:
    """Command to update organizer details"""

    organizer_id: str
    name: Optional[str] = None
    code: Optional[str] = None


@dataclass
class DeleteOrganizerCommand:
    """Command to remove a organizer (soft-delete only)"""

    organizer_id: str



