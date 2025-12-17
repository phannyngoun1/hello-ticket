"""Unified address aggregate for all entities (inspired by SAP ADRC)"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import ValidationError
from app.shared.utils import generate_id


class Address(AggregateRoot):
    """Represents a unified address that can be used by any entity (vendor, company, etc.)."""

    def __init__(
        self,
        tenant_id: str,
        street: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        postal_code: Optional[str] = None,
        country: Optional[str] = None,
        name: Optional[str] = None,
        notes: Optional[str] = None,
        address_id: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = address_id or generate_id()
        self.tenant_id = tenant_id
        self.name = name.strip() if name else None
        self.street = street.strip() if street else None
        self.city = city.strip() if city else None
        self.state = state.strip() if state else None
        self.postal_code = postal_code.strip() if postal_code else None
        self.country = country.strip() if country else None
        self.notes = notes.strip() if notes else None
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now

        self._validate()

    def update_details(
        self,
        *,
        name: Optional[str] = None,
        street: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        postal_code: Optional[str] = None,
        country: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> None:
        """Update address details with validation."""
        if name is not None:
            self.name = name.strip() if name else None
        if street is not None:
            self.street = street.strip() if street else None
        if city is not None:
            self.city = city.strip() if city else None
        if state is not None:
            self.state = state.strip() if state else None
        if postal_code is not None:
            self.postal_code = postal_code.strip() if postal_code else None
        if country is not None:
            self.country = country.strip() if country else None
        if notes is not None:
            self.notes = notes.strip() if notes else None
        self._validate()
        self._touch()

    def _validate(self) -> None:
        """Validate address has at least some information."""
        has_info = any([
            self.street,
            self.city,
            self.state,
            self.postal_code,
            self.country,
        ])
        if not has_info:
            raise ValidationError("Address must have at least one field filled (street, city, state, postal_code, or country)")

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()

    def to_dict(self) -> dict:
        """Convert to dictionary representation."""
        return {
            "street": self.street,
            "city": self.city,
            "state": self.state,
            "postal_code": self.postal_code,
            "country": self.country,
        }

