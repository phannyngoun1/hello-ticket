"""Ticketing queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class GetVenueByIdQuery:
    """Query to retrieve a venue by identifier."""

    venue_id: str


@dataclass
class GetVenueByCodeQuery:
    """Query to retrieve a venue by business code."""

    code: str


@dataclass
class SearchVenuesQuery:
    """Query to search venues with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50

