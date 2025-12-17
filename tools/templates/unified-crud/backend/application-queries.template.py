"""{{ModuleName}} queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class Get{{EntityName}}ByIdQuery:
    """Query to retrieve a {{EntityNameLower}} by identifier."""

    {{EntityNameLower}}_id: str


@dataclass
class Get{{EntityName}}ByCodeQuery:
    """Query to retrieve a {{EntityNameLower}} by business code."""

    code: str


@dataclass
class Search{{EntityNamePlural}}Query:
    """Query to search {{EntityNamePluralLower}} with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    include_deleted: bool = False
    skip: int = 0
    limit: int = 50

