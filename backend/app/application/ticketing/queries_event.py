"""Ticketing queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


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
    skip: int = 0
    limit: int = 50

