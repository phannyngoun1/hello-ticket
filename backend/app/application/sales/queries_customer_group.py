"""Sales queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class GetCustomerGroupByIdQuery:
    """Query to retrieve a customer_group by identifier."""

    customer_group_id: str


@dataclass
class GetCustomerGroupByCodeQuery:
    """Query to retrieve a customer_group by business code."""

    code: str


@dataclass
class SearchCustomerGroupsQuery:
    """Query to search customer_groups with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50


@dataclass
class GetCustomerGroupTreeQuery:
    """Query to retrieve customer_group tree."""

    include_inactive: bool = False


@dataclass
class GetCustomerGroupChildrenQuery:
    """Query to retrieve direct children of a customer_group."""

    customer_group_id: str

