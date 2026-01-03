"""Ticketing queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class GetVenueTypeByIdQuery:
    """Query to retrieve a venue_type by identifier."""

    venue_type_id: str


@dataclass
class GetVenueTypeByCodeQuery:
    """Query to retrieve a venue_type by business code."""

    code: str


@dataclass
class SearchVenueTypesQuery:
    """Query to search venue_types with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50

