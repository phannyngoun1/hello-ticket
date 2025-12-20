"""Ticketing queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class GetEventTypeByIdQuery:
    """Query to retrieve a event_type by identifier."""

    event_type_id: str


@dataclass
class GetEventTypeByCodeQuery:
    """Query to retrieve a event_type by business code."""

    code: str


@dataclass
class SearchEventTypesQuery:
    """Query to search event_types with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50

