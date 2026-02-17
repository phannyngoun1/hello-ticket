"""LookupValue - unified lookup/reference data entity."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import ValidationError
from app.shared.utils import generate_id


class LookupValue(AggregateRoot):
    """Represents a lookup value - code/name pair for dropdowns and reference data."""

    def __init__(
        self,
        tenant_id: str,
        type_code: str,
        code: str,
        name: str,
        lookup_id: Optional[str] = None,
        sort_order: int = 0,
        is_active: bool = True,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = lookup_id or generate_id()
        self.tenant_id = tenant_id
        self.type_code = type_code
        self.code = self._normalize_code(code)
        self.name = self._normalize_name(name)
        self.sort_order = sort_order
        self.is_active = is_active
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now

        self._validate()

    def update_details(
        self,
        *,
        code: Optional[str] = None,
        name: Optional[str] = None,
        sort_order: Optional[int] = None,
    ) -> None:
        """Update lookup value with validation."""
        if code is not None:
            self.code = self._normalize_code(code)
        if name is not None:
            self.name = self._normalize_name(name)
        if sort_order is not None:
            self.sort_order = sort_order
        self._touch()

    def _normalize_code(self, code: str) -> str:
        if not code or not code.strip():
            raise ValidationError("Lookup code is required")
        normalized = code.strip().upper()
        if len(normalized) > 50:
            raise ValidationError("Lookup code cannot exceed 50 characters")
        return normalized

    def _normalize_name(self, name: str) -> str:
        if not name or not name.strip():
            raise ValidationError("Lookup name is required")
        return name.strip()

    def _validate(self) -> None:
        if not self.type_code or not self.type_code.strip():
            raise ValidationError("Lookup type_code is required")

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
