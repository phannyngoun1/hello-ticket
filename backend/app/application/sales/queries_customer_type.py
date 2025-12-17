"""Sales queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class GetCustomerTypeByIdQuery:
    """Query to retrieve a customer_type by identifier."""

    customer_type_id: str


@dataclass
class GetCustomerTypeByCodeQuery:
    """Query to retrieve a customer_type by business code."""

    code: str


@dataclass
class SearchCustomerTypesQuery:
    """Query to search customer_types with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50

