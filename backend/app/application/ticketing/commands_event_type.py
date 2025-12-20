"""Ticketing commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateEventTypeCommand:
    """Command to create a new event_type"""

    name: str
    code: str


@dataclass
class UpdateEventTypeCommand:
    """Command to update event_type details"""

    event_type_id: str
    name: Optional[str] = None
    code: Optional[str] = None


@dataclass
class DeleteEventTypeCommand:
    """Command to remove a event_type (soft-delete only)"""

    event_type_id: str



