"""Show aggregate for Ticketing - Advanced CRUD with complex relationships."""
from __future__ import annotations

from datetime import datetime, timezone, date
from typing import Optional, Dict, Any, List

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id
from app.shared.enums import ShowImageTypeEnum


class Show(AggregateRoot):
    """Represents a show - advanced entity with complex relationships and business logic."""

    def __init__(
        self,
        tenant_id: str,
        code: str,
        name: str,
        show_id: Optional[str] = None,
        organizer_id: Optional[str] = None,
        is_active: bool = True,
        attributes: Optional[Dict[str, Any]] = None,
        started_date: Optional[date] = None,
        ended_date: Optional[date] = None,
        images: Optional[List[Dict[str, Any]]] = None,
        note: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        deactivated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = show_id or generate_id()
        self.tenant_id = tenant_id
        self.code = self._validate_code(code) if code else None
        self.name = self._validate_name(name)
        self.organizer_id = organizer_id

        self.is_active = is_active
        self.attributes = attributes or {}
        self.started_date = started_date
        self.ended_date = ended_date
        self.images = self._validate_images(images) if images else []
        self.note = self._validate_note(note) if note else None
        self.deactivated_at = deactivated_at
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now

        self._validate()

    def update_details(
        self,
        *,
        code: Optional[str] = None,
        name: Optional[str] = None,
        organizer_id: Optional[str] = None,
        started_date: Optional[date] = None,
        ended_date: Optional[date] = None,
        images: Optional[List[Dict[str, Any]]] = None,
        note: Optional[str] = None,
    ) -> None:
        """Update show master data with validation."""
        if code is not None:
            self.code = self._validate_code(code)
        if name is not None:
            self.name = self._validate_name(name)
        if organizer_id is not None:
            self.organizer_id = organizer_id
        if started_date is not None:
            self.started_date = started_date
        if ended_date is not None:
            self.ended_date = ended_date
        if images is not None:
            self.images = self._validate_images(images)
        if note is not None:
            self.note = self._validate_note(note)

        self._validate()
        self._touch()

    def activate(self) -> None:
        if self.is_active:
            return
        self.is_active = True
        self.deactivated_at = None
        self._touch()

    def deactivate(self) -> None:
        if not self.is_active:
            return
        self.is_active = False
        self.deactivated_at = datetime.now(timezone.utc)
        self._touch()

    def _validate_code(self, code: Optional[str]) -> Optional[str]:
        """Validate show code format."""
        if code is None:
            return None
        if not code or not code.strip():
            raise ValidationError("Show code cannot be empty if provided")
        code = code.strip().upper()
        if len(code) > 100:
            raise ValidationError("Show code cannot exceed 100 characters")
        return code

    def _validate_name(self, name: str) -> str:
        """Validate show name."""
        if not name or not name.strip():
            raise ValidationError("Show name is required")
        return name.strip()

    def _validate_images(self, images: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate show images."""
        if not isinstance(images, list):
            raise ValidationError("Images must be a list")
        
        validated_images = []
        for img in images:
            if not isinstance(img, dict):
                raise ValidationError("Each image must be a dictionary")
            
            if 'url' not in img or not img['url']:
                raise ValidationError("Each image must have a 'url' field")
            
            if 'type' not in img or not img['type']:
                raise ValidationError("Each image must have a 'type' field")
            
            # Validate image type enum
            try:
                ShowImageTypeEnum(img['type'])
            except ValueError:
                raise ValidationError(f"Invalid image type: {img['type']}. Must be one of: {', '.join([e.value for e in ShowImageTypeEnum])}")
            
            validated_images.append({
                'url': str(img['url']).strip(),
                'type': img['type']
            })
        
        return validated_images

    def _validate_note(self, note: Optional[str]) -> Optional[str]:
        """Validate show note."""
        if note is None:
            return None
        note = note.strip()
        if len(note) > 5000:
            raise ValidationError("Note cannot exceed 5000 characters")
        return note

    def _validate(self) -> None:
        """Validate show data and business rules."""
        if self.started_date and self.ended_date:
            if self.started_date > self.ended_date:
                raise ValidationError("Started date cannot be after ended date")

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()


def ensure_same_tenant(show: Show, tenant_id: str) -> None:
    if show.tenant_id != tenant_id:
        raise BusinessRuleError("Show tenant mismatch")

