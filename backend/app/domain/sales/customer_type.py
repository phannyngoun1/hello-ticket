"""CustomerType aggregate for Sales - Basic CRUD."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id


class CustomerType(AggregateRoot):
    """Represents a customer_type - simple master data entity."""

    def __init__(
        self,
        tenant_id: str,
        code: str,
        name: str,
        customer_type_id: Optional[str] = None,

        is_active: bool = True,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = customer_type_id or generate_id()
        self.tenant_id = tenant_id
        self.code = self._normalize_code(code)
        self.name = self._normalize_name(name)

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

    ) -> None:
        """Update customer_type master data with validation."""
        if code is not None:
            self.code = self._normalize_code(code)
        if name is not None:
            self.name = self._normalize_name(name)

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

    def _normalize_code(self, code: str) -> str:
        if not code or not code.strip():
            raise ValidationError("CustomerType code is required")
        normalized = code.strip().upper()
        if len(normalized) > 50:
            raise ValidationError("CustomerType code cannot exceed 50 characters")
        return normalized

    def _normalize_name(self, name: str) -> str:
        if not name or not name.strip():
            raise ValidationError("CustomerType name is required")
        return name.strip()


    def _validate(self) -> None:
        """Validate customer_type data."""

        pass

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()


def ensure_same_tenant(customer_type: CustomerType, tenant_id: str) -> None:
    if customer_type.tenant_id != tenant_id:
        raise BusinessRuleError("CustomerType tenant mismatch")

