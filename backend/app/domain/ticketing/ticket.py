"""Ticket aggregate for Ticketing - Represents a ticket issued for an event seat."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from enum import Enum

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id
from app.shared.enums import TicketStatusEnum


class Ticket(AggregateRoot):
    """
    Represents a ticket issued for an event seat.
    Tickets are created when seats are sold or reserved.
    """

    def __init__(
        self,
        tenant_id: str,
        event_id: str,
        event_seat_id: str,
        ticket_number: str,
        status: TicketStatusEnum = TicketStatusEnum.AVAILABLE,
        price: float = 0.0,
        currency: str = "USD",
        booking_id: Optional[str] = None,
        barcode: Optional[str] = None,
        qr_code: Optional[str] = None,
        transfer_token: Optional[str] = None,
        reserved_at: Optional[datetime] = None,
        reserved_until: Optional[datetime] = None,
        expires_at: Optional[datetime] = None,
        scanned_at: Optional[datetime] = None,
        issued_at: Optional[datetime] = None,
        ticket_id: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = ticket_id or generate_id()
        self.tenant_id = tenant_id
        self.event_id = event_id
        self.event_seat_id = event_seat_id
        self.ticket_number = ticket_number
        self.status = status
        self.price = price
        self.currency = currency
        self.booking_id = booking_id
        self.barcode = barcode or self._generate_barcode()
        self.qr_code = qr_code or self._generate_qr_code()
        self.transfer_token = transfer_token
        self.reserved_at = reserved_at or (now if status in [TicketStatusEnum.RESERVED, TicketStatusEnum.AVAILABLE] else None)
        self.reserved_until = reserved_until
        self.expires_at = expires_at
        self.scanned_at = scanned_at
        self.issued_at = issued_at or now
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now

        self._validate()

    def _generate_barcode(self) -> str:
        """Generate a unique barcode for the ticket"""
        return f"BC-{self.id[:12].upper()}"

    def _generate_qr_code(self) -> str:
        """Generate a unique QR code for the ticket"""
        return f"QR-{self.id[:12].upper()}"

    def confirm(self) -> None:
        """Confirm ticket (after payment)"""
        if self.status != TicketStatusEnum.RESERVED:
            raise BusinessRuleError(f"Ticket cannot be confirmed (current status: {self.status})")
        self.status = TicketStatusEnum.CONFIRMED
        self._touch()

    def cancel(self) -> None:
        """Cancel ticket"""
        if self.status in [TicketStatusEnum.CANCELLED, TicketStatusEnum.USED]:
            raise BusinessRuleError(f"Ticket cannot be cancelled (current status: {self.status})")
        self.status = TicketStatusEnum.CANCELLED
        self._touch()

    def mark_as_used(self) -> None:
        """Mark ticket as used (scanned at entry)"""
        if self.status != TicketStatusEnum.CONFIRMED:
            raise BusinessRuleError(f"Ticket cannot be marked as used (current status: {self.status})")
        self.status = TicketStatusEnum.USED
        self.scanned_at = datetime.now(timezone.utc)
        self._touch()

    def transfer(self, new_transfer_token: str) -> None:
        """Transfer ticket to another customer"""
        if self.status != TicketStatusEnum.CONFIRMED:
            raise BusinessRuleError(f"Ticket cannot be transferred (current status: {self.status})")
        self.status = TicketStatusEnum.TRANSFERRED
        self.transfer_token = new_transfer_token
        self._touch()

    def _validate(self) -> None:
        """Validate ticket data"""
        if not self.tenant_id:
            raise ValidationError("Tenant ID is required")
        if not self.event_id:
            raise ValidationError("Event ID is required")
        if not self.event_seat_id:
            raise ValidationError("Event seat ID is required")
        if not self.ticket_number:
            raise ValidationError("Ticket number is required")
        if self.price < 0:
            raise ValidationError("Price cannot be negative")

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()

