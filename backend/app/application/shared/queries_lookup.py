"""Shared lookup queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class GetLookupByIdQuery:
    """Query to retrieve a lookup by identifier."""

    type_code: str
    lookup_id: str


@dataclass
class GetLookupByCodeQuery:
    """Query to retrieve a lookup by business code."""

    type_code: str
    code: str


@dataclass
class SearchLookupsQuery:
    """Query to search lookups with optional filters."""

    type_code: str
    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50
