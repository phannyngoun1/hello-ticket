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
    skip: int = 0
    limit: int = 50


@dataclass
class Get{{EntityName}}TreeQuery:
    """Query to retrieve {{EntityNameLower}} tree."""

    include_inactive: bool = False


@dataclass
class Get{{EntityName}}ChildrenQuery:
    """Query to retrieve direct children of a {{EntityNameLower}}."""

    {{EntityNameLower}}_id: str

