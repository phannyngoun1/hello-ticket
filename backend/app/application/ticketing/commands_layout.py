"""Ticketing commands for Layout CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateLayoutCommand:
    """Command to create a new layout"""

    venue_id: str
    name: str
    description: Optional[str] = None
    file_id: Optional[str] = None


@dataclass
class UpdateLayoutCommand:
    """Command to update layout details"""

    layout_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    file_id: Optional[str] = None


@dataclass
class DeleteLayoutCommand:
    """Command to remove a layout (soft-delete only)"""

    layout_id: str
