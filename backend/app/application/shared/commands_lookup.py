"""Shared lookup commands for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateLookupCommand:
    """Command to create a new lookup value."""

    type_code: str
    code: str
    name: str


@dataclass
class UpdateLookupCommand:
    """Command to update lookup value details."""

    type_code: str
    lookup_id: str
    code: Optional[str] = None
    name: Optional[str] = None


@dataclass
class DeleteLookupCommand:
    """Command to remove a lookup value (soft-delete by default)."""

    type_code: str
    lookup_id: str
