"""Ticketing queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional, List


@dataclass
class GetEventByIdQuery:
    """Query to retrieve a event by identifier."""

    event_id: str


@dataclass
class GetEventByCodeQuery:
    """Query to retrieve a event by business code."""

    code: str


@dataclass
class SearchEventsQuery:
    """Query to search events with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    show_id: Optional[str] = None
    layout_id: Optional[str] = None
    status: Optional[List[str]] = None
    skip: int = 0
    limit: int = 50
    sort_by: str = "start_dt"
    sort_order: str = "asc"

