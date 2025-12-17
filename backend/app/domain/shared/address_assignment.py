"""Address assignment aggregate for polymorphic address relationships (inspired by SAP ADCP)"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import ValidationError
from app.shared.utils import generate_id


class AddressAssignment(AggregateRoot):
    """Represents an assignment of an address to an entity with a specific address type."""

    # Valid entity types
    ENTITY_TYPE_VENDOR = "vendor"
    ENTITY_TYPE_COMPANY = "company"
    ENTITY_TYPE_CUSTOMER = "customer"
    ENTITY_TYPE_USER = "user"

    # Valid address types
    ADDRESS_TYPE_SHIPPING = "shipping"
    ADDRESS_TYPE_BILLING = "billing"
    ADDRESS_TYPE_CONTACT = "contact"
    ADDRESS_TYPE_DEFAULT = "default"

    def __init__(
        self,
        tenant_id: str,
        address_id: str,
        entity_type: str,
        entity_id: str,
        address_type: str,
        is_primary: bool = False,
        assignment_id: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = assignment_id or generate_id()
        self.tenant_id = tenant_id
        self.address_id = address_id
        self.entity_type = self._normalize_entity_type(entity_type)
        self.entity_id = entity_id
        self.address_type = self._normalize_address_type(address_type)
        self.is_primary = is_primary
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now

        self._validate()

    def update_assignment(
        self,
        *,
        address_type: Optional[str] = None,
        is_primary: Optional[bool] = None,
    ) -> None:
        """Update assignment details."""
        if address_type is not None:
            self.address_type = self._normalize_address_type(address_type)
        if is_primary is not None:
            self.is_primary = is_primary
        self._touch()

    def set_as_primary(self) -> None:
        """Set this assignment as primary for its address type."""
        self.is_primary = True
        self._touch()

    def unset_as_primary(self) -> None:
        """Remove primary status from this assignment."""
        self.is_primary = False
        self._touch()

    def _normalize_entity_type(self, entity_type: str) -> str:
        """Normalize and validate entity type."""
        normalized = entity_type.strip().lower()
        valid_types = [
            self.ENTITY_TYPE_VENDOR,
            self.ENTITY_TYPE_COMPANY,
            self.ENTITY_TYPE_CUSTOMER,
            self.ENTITY_TYPE_USER,
        ]
        if normalized not in valid_types:
            raise ValidationError(f"Entity type must be one of: {', '.join(valid_types)}")
        return normalized

    def _normalize_address_type(self, address_type: str) -> str:
        """Normalize and validate address type."""
        normalized = address_type.strip().lower()
        valid_types = [
            self.ADDRESS_TYPE_SHIPPING,
            self.ADDRESS_TYPE_BILLING,
            self.ADDRESS_TYPE_CONTACT,
            self.ADDRESS_TYPE_DEFAULT,
        ]
        if normalized not in valid_types:
            raise ValidationError(f"Address type must be one of: {', '.join(valid_types)}")
        return normalized

    def _validate(self) -> None:
        """Validate assignment."""
        if not self.address_id:
            raise ValidationError("Address ID is required")
        if not self.entity_id:
            raise ValidationError("Entity ID is required")

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()

