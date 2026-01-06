"""Sales queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class GetEmployeeByIdQuery:
    """Query to retrieve a employee by identifier."""

    employee_id: str


@dataclass
class GetEmployeeByCodeQuery:
    """Query to retrieve a employee by business code."""

    code: str


@dataclass
class SearchEmployeesQuery:
    """Query to search employees with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50

