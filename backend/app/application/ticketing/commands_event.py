"""Ticketing commands for CQRS pattern"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from app.shared.enums import EventStatusEnum


@dataclass
class CreateEventCommand:
    """Command to create a new event"""

    show_id: str
    title: str
    start_dt: datetime
    duration_minutes: int
    venue_id: str
    layout_id: Optional[str] = None
    status: EventStatusEnum = EventStatusEnum.DRAFT


@dataclass
class UpdateEventCommand:
    """Command to update event details"""

    event_id: str
    title: Optional[str] = None
    start_dt: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    venue_id: Optional[str] = None
    layout_id: Optional[str] = None
    status: Optional[EventStatusEnum] = None


@dataclass
class DeleteEventCommand:
    """Command to remove an event (soft-delete only)"""

    event_id: str



