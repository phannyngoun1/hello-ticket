"""Customer aggregate for sales."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id

class Customer(AggregateRoot):
    """Represents a customer."""

    def __init__(
        self,
        tenant_id: str,
        code: str,
        name: str,
        customer_id: Optional[str] = None,

        is_active: bool = True,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        deactivated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = customer_id or generate_id()
        self.tenant_id = tenant_id
        self.code = self._normalize_code(code)
        self.name = self._normalize_name(name)

        self.is_active = is_active
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
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ) -> None:
        """Update customer master data with validation."""
        if code is not None:
            self.code = self._normalize_code(code)
        if name is not None:
            self.name = self._normalize_name(name)
        if created_at is not None:
            self.created_at = created_at
        if updated_at is not None:
            self.updated_at = updated_at
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

    def _normalize_code(self, code: str) -> str:
        if not code or not code.strip():
            raise ValidationError("Customer code is required")
        normalized = code.strip().upper()
        if len(normalized) > 50:
            raise ValidationError("Customer code cannot exceed 50 characters")
        return normalized

    def _normalize_name(self, name: str) -> str:
        if not name or not name.strip():
            raise ValidationError("Customer name is required")
        return name.strip()

    def _validate(self) -> None:
        """Validate customer data."""

        pass

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()

def ensure_same_tenant(customer: Customer, tenant_id: str) -> None:
    if customer.tenant_id != tenant_id:
        raise BusinessRuleError("Customer tenant mismatch")
