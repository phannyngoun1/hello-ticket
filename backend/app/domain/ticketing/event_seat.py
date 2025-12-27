"""EventSeat aggregate for Ticketing - Manages seat status and inventory for specific events."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Dict, Any
from enum import Enum

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id
from app.shared.enums import EventSeatStatusEnum


class EventSeat(AggregateRoot):
    """
    Represents a specific seat instance for an event.
    This can either be linked to a layout seat (SEAT_SETUP)
    or be a standalone seat entry (TICKET_IMPORT / Broker flow).
    """

    def __init__(
        self,
        tenant_id: str,
        event_id: str,
        status: EventSeatStatusEnum = EventSeatStatusEnum.AVAILABLE,
        seat_id: Optional[str] = None,  # Reference to Venue Seat if applicable
        section_name: Optional[str] = None,
        row_name: Optional[str] = None,
        seat_number: Optional[str] = None,
        price: float = 0.0,
        ticket_code: Optional[str] = None,
        broker_id: Optional[str] = None,
        event_seat_id: Optional[str] = None,
        is_active: bool = True,
        attributes: Optional[Dict[str, Any]] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = event_seat_id or generate_id()
        self.tenant_id = tenant_id
        self.event_id = event_id
        self.status = status
        self.seat_id = seat_id
        self.section_name = section_name
        self.row_name = row_name
        self.seat_number = seat_number
        self.price = price
        self.ticket_code = ticket_code
        self.broker_id = broker_id
        self.is_active = is_active
        self.attributes = attributes or {}
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now

        self._validate()

    def reserve(self) -> None:
        """Mark seat as reserved."""
        if self.status != EventSeatStatusEnum.AVAILABLE:
            raise BusinessRuleError(f"Seat is not available for reservation (current status: {self.status})")
        self.status = EventSeatStatusEnum.RESERVED
        self._touch()

    def release(self) -> None:
        """Release a reserved seat back to available."""
        if self.status != EventSeatStatusEnum.RESERVED:
            return
        self.status = EventSeatStatusEnum.AVAILABLE
        self._touch()

    def sell(self, ticket_code: str) -> None:
        """Mark seat as sold."""
        if self.status not in [EventSeatStatusEnum.AVAILABLE, EventSeatStatusEnum.RESERVED]:
            raise BusinessRuleError(f"Seat cannot be sold (current status: {self.status})")
        self.status = EventSeatStatusEnum.SOLD
        self.ticket_code = ticket_code
        self._touch()

    def hold(self) -> None:
        """Mark seat as held (internal)."""
        self.status = EventSeatStatusEnum.HELD
        self._touch()

    def block(self) -> None:
        """Block seat from sale."""
        self.status = EventSeatStatusEnum.BLOCKED
        self._touch()

    def update_price(self, price: float) -> None:
        """Update seat price."""
        if price < 0:
            raise ValidationError("Price cannot be negative")
        self.price = price
        self._touch()

    def _validate(self) -> None:
        """Validate event seat data."""
        if not self.tenant_id:
            raise ValidationError("Tenant ID is required")
        if not self.event_id:
            raise ValidationError("Event ID is required")
        
        # If no seat_id, we MUST have section/row/number
        if not self.seat_id and not (self.section_name and self.row_name and self.seat_number):
            raise ValidationError("Either seat_id or (section_name, row_name, seat_number) must be provided")

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()


def ensure_same_tenant(event_seat: EventSeat, tenant_id: str) -> None:
    if event_seat.tenant_id != tenant_id:
        raise BusinessRuleError("Event seat tenant mismatch")
