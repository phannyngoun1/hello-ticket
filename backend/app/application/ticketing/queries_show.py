"""Ticketing queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class GetShowByIdQuery:
    """Query to retrieve a show by identifier."""

    show_id: str


@dataclass
class GetShowByCodeQuery:
    """Query to retrieve a show by business code."""

    code: str


@dataclass
class SearchShowsQuery:
    """Query to search shows with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50

