"""{{EntityName}} aggregate for {{ModuleName}} - Tree/Hierarchical CRUD."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, List{{OptionalDictImport}}

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id


class {{EntityName}}(AggregateRoot):
    """Represents a {{EntityNameLower}} - hierarchical/tree entity with parent-child relationships."""

    def __init__(
        self,
        tenant_id: str,
        code: str,
        name: str,
        {{EntityNameLower}}_id: Optional[str] = None,
        parent_{{EntityNameLower}}_id: Optional[str] = None,
        level: int = 0,
        sort_order: int = 0,
{{InitFields}}
        is_active: bool = True,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        deactivated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = {{EntityNameLower}}_id or generate_id()
        self.tenant_id = tenant_id
        self.code = self._normalize_code(code)
        self.name = self._normalize_name(name)
        self.parent_{{EntityNameLower}}_id = parent_{{EntityNameLower}}_id
        self.level = level
        self.sort_order = sort_order
{{InitAssignments}}

        # Children collection for hierarchy use-cases (not persisted directly)
        self.children: List["{{EntityName}}"] = []

        self.is_active = is_active
        self.deactivated_at = deactivated_at
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now

        # Validate hierarchy
        if parent_{{EntityNameLower}}_id:
            self.level = level if level > 0 else 1  # Default to 1 if parent exists
        else:
            self.level = 0  # Root entity

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

    def set_parent(self, parent_{{EntityNameLower}}_id: Optional[str], level: Optional[int] = None) -> None:
        """Set parent {{EntityNameLower}} (for hierarchy)."""
        # Cannot set self as parent
        if parent_{{EntityNameLower}}_id == self.id:
            raise BusinessRuleError("{{EntityName}} cannot be its own parent")

        self.parent_{{EntityNameLower}}_id = parent_{{EntityNameLower}}_id
        if parent_{{EntityNameLower}}_id:
            # If level is provided, use it; otherwise calculate or default to parent_level + 1
            self.level = level if level is not None else (self.level + 1 if self.level == 0 else self.level)
        else:
            # Root entity
            self.level = 0

        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()

    def update_sort_order(self, sort_order: int) -> None:
        """Update sort order."""
        self.sort_order = sort_order
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()

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

    def is_root(self) -> bool:
        """Check if {{EntityNameLower}} is root (no parent)."""
        return self.parent_{{EntityNameLower}}_id is None

    def has_parent(self) -> bool:
        """Check if {{EntityNameLower}} has a parent."""
        return self.parent_{{EntityNameLower}}_id is not None

    def add_child(self, child: "{{EntityName}}") -> None:
        """Attach a child to this {{EntityNameLower}} (used when building hierarchies)."""
        if child.id == self.id:
            raise BusinessRuleError("{{EntityName}} cannot be its own child")
        self.children.append(child)

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

