"""{{EntityName}} aggregate for {{ModuleName}}."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional{{OptionalDictImport}}

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id


class {{EntityName}}(AggregateRoot):
    """Represents a {{EntityNameLower}}."""

    def __init__(
        self,
        tenant_id: str,
        code: str,
        name: str,
        {{EntityNameLower}}_id: Optional[str] = None,
{{InitFields}}
        is_active: bool = True,
        is_deleted: bool = False,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        deleted_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = {{EntityNameLower}}_id or generate_id()
        self.tenant_id = tenant_id
        self.code = self._normalize_code(code)
        self.name = self._normalize_name(name)
{{InitAssignments}}
        self.is_active = is_active
        self.is_deleted = is_deleted
        self.deleted_at = deleted_at
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now

        self._validate()

    def update_details(
        self,
        *,
        code: Optional[str] = None,
        name: Optional[str] = None,
{{UpdateFields}}
    ) -> None:
        """Update {{EntityNameLower}} master data with validation."""
        if code is not None:
            self.code = self._normalize_code(code)
        if name is not None:
            self.name = self._normalize_name(name)
{{UpdateAssignments}}
        self._validate()
        self._touch()

    def activate(self) -> None:
        """Activate {{EntityNameLower}} for business use."""
        if self.is_active:
            return
        self.is_active = True
        self._touch()

    def deactivate(self) -> None:
        """Deactivate {{EntityNameLower}} for business use (not the same as deleting)."""
        if not self.is_active:
            return
        self.is_active = False
        self._touch()

    def mark_deleted(self) -> None:
        """Mark as soft deleted."""
        if self.is_deleted:
            return
        self.is_deleted = True
        self.deleted_at = datetime.now(timezone.utc)
        self._touch()

    def _normalize_code(self, code: str) -> str:
        if not code or not code.strip():
            raise ValidationError("{{EntityName}} code is required")
        normalized = code.strip().upper()
        if len(normalized) > 50:
            raise ValidationError("{{EntityName}} code cannot exceed 50 characters")
        return normalized

    def _normalize_name(self, name: str) -> str:
        if not name or not name.strip():
            raise ValidationError("{{EntityName}} name is required")
        return name.strip()

{{NormalizeMethods}}
    def _validate(self) -> None:
        """Validate {{EntityNameLower}} data."""
{{ValidationMethods}}
        pass

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()


def ensure_same_tenant({{EntityNameLower}}: {{EntityName}}, tenant_id: str) -> None:
    if {{EntityNameLower}}.tenant_id != tenant_id:
        raise BusinessRuleError("{{EntityName}} tenant mismatch")

