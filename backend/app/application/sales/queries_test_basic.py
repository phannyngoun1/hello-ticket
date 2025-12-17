"""Sales queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class GetTestBasicByIdQuery:
    """Query to retrieve a test_basic by identifier."""

    test_basic_id: str


@dataclass
class GetTestBasicByCodeQuery:
    """Query to retrieve a test_basic by business code."""

    code: str


@dataclass
class SearchTestBasicsQuery:
    """Query to search test_basics with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50

