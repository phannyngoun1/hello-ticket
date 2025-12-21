"""Seat aggregate for Ticketing - Seat management for venues."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Dict, Any
from enum import Enum

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id


class SeatType(str, Enum):
    """Seat type enumeration"""
    STANDARD = "STANDARD"
    VIP = "VIP"
    WHEELCHAIR = "WHEELCHAIR"
    COMPANION = "COMPANION"


class Seat(AggregateRoot):
    """Represents a seat within a venue - used for seat map visualization and management."""

    def __init__(
        self,
        tenant_id: str,
        venue_id: str,
        layout_id: str,
        section: str,
        row: str,
        seat_number: str,
        seat_type: SeatType = SeatType.STANDARD,
        x_coordinate: Optional[float] = None,
        y_coordinate: Optional[float] = None,
        seat_id: Optional[str] = None,
        is_active: bool = True,
        attributes: Optional[Dict[str, Any]] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = seat_id or generate_id()
        self.tenant_id = tenant_id
        self.venue_id = venue_id
        self.layout_id = layout_id
        self.section = self._validate_section(section)
        self.row = self._validate_row(row)
        self.seat_number = self._validate_seat_number(seat_number)
        self.seat_type = seat_type
        self.x_coordinate = x_coordinate
        self.y_coordinate = y_coordinate
        self.is_active = is_active
        self.attributes = attributes or {}
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now

        self._validate()

    def update_details(
        self,
        *,
        section: Optional[str] = None,
        row: Optional[str] = None,
        seat_number: Optional[str] = None,
        seat_type: Optional[SeatType] = None,
        x_coordinate: Optional[float] = None,
        y_coordinate: Optional[float] = None,
    ) -> None:
        """Update seat details with validation."""
        if section is not None:
            self.section = self._validate_section(section)
        if row is not None:
            self.row = self._validate_row(row)
        if seat_number is not None:
            self.seat_number = self._validate_seat_number(seat_number)
        if seat_type is not None:
            self.seat_type = seat_type
        if x_coordinate is not None:
            self.x_coordinate = x_coordinate
        if y_coordinate is not None:
            self.y_coordinate = y_coordinate

        self._validate()
        self._touch()

    def update_coordinates(self, x: float, y: float) -> None:
        """Update seat coordinates for seat map visualization."""
        self.x_coordinate = x
        self.y_coordinate = y
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

    def _validate_section(self, section: str) -> str:
        """Validate section name."""
        if not section or not section.strip():
            raise ValidationError("Seat section is required")
        return section.strip()

    def _validate_row(self, row: str) -> str:
        """Validate row identifier."""
        if not row or not row.strip():
            raise ValidationError("Seat row is required")
        return row.strip()

    def _validate_seat_number(self, seat_number: str) -> str:
        """Validate seat number."""
        if not seat_number or not seat_number.strip():
            raise ValidationError("Seat number is required")
        return seat_number.strip()

    def _validate(self) -> None:
        """Validate seat data and business rules."""
        if not self.venue_id:
            raise ValidationError("Venue ID is required")
        if not self.layout_id:
            raise ValidationError("Layout ID is required")
        if not self.tenant_id:
            raise ValidationError("Tenant ID is required")

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()


def ensure_same_tenant(seat: Seat, tenant_id: str) -> None:
    if seat.tenant_id != tenant_id:
        raise BusinessRuleError("Seat tenant mismatch")
