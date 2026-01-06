"""Organizer aggregate for Ticketing - Advanced CRUD with complex relationships."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id


class Organizer(AggregateRoot):
    """Represents a organizer - advanced entity with complex relationships and business logic."""

    def __init__(
        self,
        tenant_id: str,
        code: str,
        name: str,
        description: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        website: Optional[str] = None,
        address: Optional[str] = None,
        city: Optional[str] = None,
        country: Optional[str] = None,
        logo: Optional[str] = None,
        organizer_id: Optional[str] = None,

        is_active: bool = True,
        attributes: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        deactivated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = organizer_id or generate_id()
        self.tenant_id = tenant_id
        self.code = self._validate_code(code) if code else None
        self.name = self._validate_name(name)
        self.description = description
        self.email = email
        self.phone = phone
        self.website = website
        self.address = address
        self.city = city
        self.country = country
        self.logo = logo
        self.tags = tags or []

        self.is_active = is_active
        self.attributes = attributes or {}
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
        description: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        website: Optional[str] = None,
        address: Optional[str] = None,
        city: Optional[str] = None,
        country: Optional[str] = None,
        logo: Optional[str] = None,
        tags: Optional[List[str]] = None,

    ) -> None:
        """Update organizer master data with validation."""
        if code is not None:
            self.code = self._validate_code(code)
        if name is not None:
            self.name = self._validate_name(name)
        
        if description is not None:
            self.description = description
        if email is not None:
            self.email = email
        if phone is not None:
            self.phone = phone
        if website is not None:
            self.website = website
        if address is not None:
            self.address = address
        if city is not None:
            self.city = city
        if country is not None:
            self.country = country
        if logo is not None:
            self.logo = logo
        if tags is not None:
            self.tags = tags

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
        """Validate organizer code format."""
        if code is None:
            return None
        if not code or not code.strip():
            raise ValidationError("Organizer code cannot be empty if provided")
        code = code.strip().upper()
        if len(code) > 100:
            raise ValidationError("Organizer code cannot exceed 100 characters")
        return code

    def _validate_name(self, name: str) -> str:
        """Validate organizer name."""
        if not name or not name.strip():
            raise ValidationError("Organizer name is required")
        return name.strip()


    def _validate(self) -> None:
        """Validate organizer data and business rules."""

        pass

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()


def ensure_same_tenant(organizer: Organizer, tenant_id: str) -> None:
    if organizer.tenant_id != tenant_id:
        raise BusinessRuleError("Organizer tenant mismatch")

