"""Tag aggregate for shared/reusable tags across the system."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import ValidationError
from app.shared.utils import generate_id


class Tag(AggregateRoot):
    """Represents a reusable tag that can be linked to any domain entity."""

    def __init__(
        self,
        tenant_id: str,
        name: str,
        entity_type: str,  # e.g., "customer", "event", "booking" - specifies which entity type this tag can be used for
        tag_id: Optional[str] = None,
        description: Optional[str] = None,
        color: Optional[str] = None,  # Hex color code for UI display
        is_active: bool = True,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = tag_id or generate_id()
        self.tenant_id = tenant_id
        self.name = self._normalize_name(name)
        self.entity_type = entity_type.lower() if entity_type else None
        self.description = description.strip() if description else None
        self.color = self._normalize_color(color) if color else None
        self.is_active = is_active
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now

        self._validate()

    def _normalize_name(self, name: str) -> str:
        """Normalize tag name - lowercase, trimmed, no spaces."""
        if not name:
            raise ValidationError("Tag name is required")
        normalized = name.strip().lower()
        if not normalized:
            raise ValidationError("Tag name cannot be empty")
        if len(normalized) > 100:
            raise ValidationError("Tag name cannot exceed 100 characters")
        return normalized

    def _normalize_color(self, color: str) -> str:
        """Normalize color hex code."""
        if not color:
            return None
        normalized = color.strip().upper()
        # Remove # if present
        if normalized.startswith("#"):
            normalized = normalized[1:]
        # Validate hex color
        if len(normalized) != 6:
            raise ValidationError("Color must be a 6-character hex code")
        try:
            int(normalized, 16)
        except ValueError:
            raise ValidationError("Color must be a valid hex code")
        return normalized

    def _validate(self) -> None:
        """Validate tag."""
        if not self.tenant_id:
            raise ValidationError("Tenant ID is required")
        if not self.name:
            raise ValidationError("Tag name is required")
        if not self.entity_type:
            raise ValidationError("Entity type is required")

    def update_details(
        self,
        *,
        name: Optional[str] = None,
        entity_type: Optional[str] = None,
        description: Optional[str] = None,
        color: Optional[str] = None,
    ) -> None:
        """Update tag details."""
        if name is not None:
            self.name = self._normalize_name(name)
        if entity_type is not None:
            self.entity_type = entity_type.lower()
        if description is not None:
            self.description = description.strip() if description else None
        if color is not None:
            self.color = self._normalize_color(color) if color else None
        
        self.updated_at = datetime.now(timezone.utc)
        self._touch()

    def activate(self) -> None:
        """Activate the tag."""
        if self.is_active:
            return
        self.is_active = True
        self._touch()

    def deactivate(self) -> None:
        """Deactivate the tag."""
        if not self.is_active:
            return
        self.is_active = False
        self._touch()

    def _touch(self) -> None:
        """Update the updated_at timestamp and increment version."""
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()

