"""Layout aggregate for Ticketing - Seating layout management for venues."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Dict, Any

from app.domain.aggregates.base import AggregateRoot

# Sentinel: when passed as file_id in update_details, means "do not change file_id"
_OMIT = object()
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id


class Layout(AggregateRoot):
    """Represents a seating layout for a venue - allows multiple layouts per venue."""

    def __init__(
        self,
        tenant_id: str,
        venue_id: str,
        name: str,
        layout_id: Optional[str] = None,
        description: Optional[str] = None,
        file_id: Optional[str] = None,
        design_mode: str = "seat-level",
        canvas_background_color: Optional[str] = "#e5e7eb",
        marker_fill_transparency: float = 1.0,
        is_active: bool = True,
        attributes: Optional[Dict[str, Any]] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = layout_id or generate_id()
        self.tenant_id = tenant_id
        self.venue_id = venue_id
        self.name = self._validate_name(name)
        self.description = description
        self.file_id = file_id
        self.design_mode = self._validate_design_mode(design_mode)
        self.canvas_background_color = canvas_background_color or "#e5e7eb"
        self.marker_fill_transparency = self._validate_transparency(marker_fill_transparency)
        self.is_active = is_active
        self.attributes = attributes or {}
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now

        self._validate()

    def update_details(
        self,
        *,
        name: Optional[str] = None,
        description: Optional[str] = None,
        file_id: Optional[str] = _OMIT,
        canvas_background_color: Optional[str] = None,
        marker_fill_transparency: Optional[float] = None,
    ) -> None:
        """Update layout details with validation. Pass file_id=None to clear image."""
        if name is not None:
            self.name = self._validate_name(name)
        if description is not None:
            self.description = description
        if file_id is not _OMIT:
            self.file_id = file_id
        if canvas_background_color is not None:
            self.canvas_background_color = canvas_background_color or "#e5e7eb"
        if marker_fill_transparency is not None:
            self.marker_fill_transparency = self._validate_transparency(marker_fill_transparency)

        self._validate()
        self._touch()

    def activate(self) -> None:
        if self.is_active:
            return
        self.is_active = True
        self._touch()

    def deactivate(self) -> None:
        if not self.is_active:
            return
        self.is_active = False
        self._touch()

    def _validate_name(self, name: str) -> str:
        """Validate layout name."""
        if not name or not name.strip():
            raise ValidationError("Layout name is required")
        name = name.strip()
        if len(name) > 200:
            raise ValidationError("Layout name cannot exceed 200 characters")
        return name

    def _validate_design_mode(self, design_mode: str) -> str:
        """Validate design mode."""
        valid_modes = ["seat-level", "section-level"]
        if design_mode not in valid_modes:
            raise ValidationError(f"Design mode must be one of {valid_modes}")
        return design_mode

    def _validate_transparency(self, transparency: float) -> float:
        """Validate marker fill transparency (0.0 to 1.0)."""
        if not isinstance(transparency, (int, float)):
            raise ValidationError("Marker fill transparency must be a number")
        if transparency < 0.0 or transparency > 1.0:
            raise ValidationError("Marker fill transparency must be between 0.0 and 1.0")
        return float(transparency)

    def _validate(self) -> None:
        """Validate layout data and business rules."""
        if not self.venue_id:
            raise ValidationError("Venue ID is required")
        if not self.tenant_id:
            raise ValidationError("Tenant ID is required")

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()


def ensure_same_tenant(layout: Layout, tenant_id: str) -> None:
    if layout.tenant_id != tenant_id:
        raise BusinessRuleError("Layout tenant mismatch")
