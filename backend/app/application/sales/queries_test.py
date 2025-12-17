"""Sales queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class GetTestByIdQuery:
    """Query to retrieve a test by identifier."""

    test_id: str


@dataclass
class GetTestByCodeQuery:
    """Query to retrieve a test by business code."""

    code: str


@dataclass
class SearchTestsQuery:
    """Query to search tests with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50

