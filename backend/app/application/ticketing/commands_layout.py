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
    design_mode: Optional[str] = "seat-level"
    canvas_background_color: Optional[str] = None
    marker_fill_transparency: Optional[float] = 1.0


@dataclass
class UpdateLayoutCommand:
    """Command to update layout details"""

    layout_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    file_id: Optional[str] = None
    canvas_background_color: Optional[str] = None
    marker_fill_transparency: Optional[float] = None


@dataclass
class DeleteLayoutCommand:
    """Command to remove a layout (soft-delete only)"""

    layout_id: str


@dataclass
class CloneLayoutCommand:
    """Command to clone a layout with all its sections and seats."""

    layout_id: str


@dataclass
class BulkDesignerSaveCommand:
    """Command to bulk save designer changes: layout properties, sections, and seats in one operation"""

    layout_id: str
    venue_id: str
    canvas_background_color: Optional[str] = None
    marker_fill_transparency: Optional[float] = None
    file_id: Optional[str] = None
    sections: list[dict] = None  # List of section operations (create, update, delete)
    seats: list[dict] = None  # List of seat operations (create, update, delete)
    
    def __post_init__(self):
        if self.sections is None:
            self.sections = []
        if self.seats is None:
            self.seats = []
