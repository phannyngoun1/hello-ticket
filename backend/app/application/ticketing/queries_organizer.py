"""Ticketing queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class GetOrganizerByIdQuery:
    """Query to retrieve a organizer by identifier."""

    organizer_id: str


@dataclass
class GetOrganizerByCodeQuery:
    """Query to retrieve a organizer by business code."""

    code: str


@dataclass
class SearchOrganizersQuery:
    """Query to search organizers with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50

