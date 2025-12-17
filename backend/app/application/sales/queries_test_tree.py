"""Sales queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class GetTestTreeByIdQuery:
    """Query to retrieve a test_tree by identifier."""

    test_tree_id: str


@dataclass
class GetTestTreeByCodeQuery:
    """Query to retrieve a test_tree by business code."""

    code: str


@dataclass
class SearchTestTreesQuery:
    """Query to search test_trees with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50


@dataclass
class GetTestTreeTreeQuery:
    """Query to retrieve test_tree tree."""

    include_inactive: bool = False


@dataclass
class GetTestTreeChildrenQuery:
    """Query to retrieve direct children of a test_tree."""

    test_tree_id: str

