"""Venue aggregate for Ticketing - Advanced CRUD with complex relationships."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id
from app.domain.shared.value_objects.address import Address
from app.domain.shared.value_objects.contact_info import ContactInfo


class Venue(AggregateRoot):
    """Represents a venue - advanced entity with complex relationships and business logic."""

    def __init__(
        self,
        tenant_id: str,
        code: str,
        name: str,
        venue_id: Optional[str] = None,
        description: Optional[str] = None,
        image_url: Optional[str] = None,
        venue_type: Optional[str] = None,
        capacity: Optional[int] = None,
        parking_info: Optional[str] = None,
        accessibility: Optional[str] = None,
        amenities: Optional[List[str]] = None,
        opening_hours: Optional[str] = None,
        # Contact & Location VO
        contact_info: Optional[ContactInfo] = None,
        address: Optional[Address] = None,
        
        is_active: bool = True,
        attributes: Optional[Dict[str, Any]] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        deactivated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = venue_id or generate_id()
        self.tenant_id = tenant_id
        self.code = self._validate_code(code) if code else None
        self.name = self._validate_name(name)
        self.description = description
        self.image_url = image_url
        self.venue_type = venue_type
        self.capacity = capacity
        self.parking_info = parking_info
        self.accessibility = accessibility
        self.amenities = amenities or []
        self.opening_hours = opening_hours
        
        # Vo Integration
        self.contact_info = contact_info or ContactInfo()
        self.address = address or Address()

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
        image_url: Optional[str] = None,
        venue_type: Optional[str] = None,
        capacity: Optional[int] = None,
        parking_info: Optional[str] = None,
        accessibility: Optional[str] = None,
        amenities: Optional[List[str]] = None,
        opening_hours: Optional[str] = None,
        
        contact_info: Optional[ContactInfo] = None,
        address: Optional[Address] = None,
    ) -> None:
        """Update venue master data with validation."""
        if code is not None:
            self.code = self._validate_code(code)
        if name is not None:
            self.name = self._validate_name(name)
        if description is not None:
            self.description = description
        if image_url is not None:
            self.image_url = image_url
        if venue_type is not None:
            self.venue_type = venue_type
        if capacity is not None:
            self.capacity = capacity
        if parking_info is not None:
            self.parking_info = parking_info
        if accessibility is not None:
            self.accessibility = accessibility
        if amenities is not None:
            self.amenities = amenities
        if opening_hours is not None:
            self.opening_hours = opening_hours
        
        if contact_info is not None:
            self.contact_info = contact_info
        if address is not None:
            self.address = address

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
        """Validate venue code format."""
        if code is None:
            return None
        if not code or not code.strip():
            raise ValidationError("Venue code cannot be empty if provided")
        code = code.strip().upper()
        if len(code) > 100:
            raise ValidationError("Venue code cannot exceed 100 characters")
        return code

    def _validate_name(self, name: str) -> str:
        """Validate venue name."""
        if not name or not name.strip():
            raise ValidationError("Venue name is required")
        return name.strip()


    def _validate(self) -> None:
        """Validate venue data and business rules."""

        pass

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()


def ensure_same_tenant(venue: Venue, tenant_id: str) -> None:
    if venue.tenant_id != tenant_id:
        raise BusinessRuleError("Venue tenant mismatch")

