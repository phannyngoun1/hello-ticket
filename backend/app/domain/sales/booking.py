"""Booking aggregate for Sales - Represents a booking with tickets."""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Optional, List
from decimal import Decimal

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id
from app.shared.enums import BookingStatusEnum, BookingPaymentStatusEnum


class BookingItem:
    """Value object representing a ticket line item in a booking."""
    
    def __init__(
        self,
        event_seat_id: str,
        unit_price: float,
        section_name: Optional[str] = None,
        row_name: Optional[str] = None,
        seat_number: Optional[str] = None,
        ticket_id: Optional[str] = None,
        ticket_number: Optional[str] = None,
        item_id: Optional[str] = None,
    ):
        if not event_seat_id:
            raise ValidationError("Event seat ID is required")
        if unit_price < 0:
            raise ValidationError("Unit price cannot be negative")
        
        self.id = item_id or generate_id()
        self.event_seat_id = event_seat_id
        self.unit_price = unit_price
        self.total_price = unit_price  # For tickets, usually quantity is 1
        self.section_name = section_name
        self.row_name = row_name
        self.seat_number = seat_number
        self.ticket_id = ticket_id
        self.ticket_number = ticket_number


class Booking(AggregateRoot):
    """Represents a booking with multiple ticket line items."""
    
    def __init__(
        self,
        tenant_id: str,
        event_id: str,
        items: List[BookingItem],
        booking_id: Optional[str] = None,
        booking_number: Optional[str] = None,
        customer_id: Optional[str] = None,
        status: BookingStatusEnum = BookingStatusEnum.PENDING,
        subtotal_amount: Optional[float] = None,
        discount_amount: float = 0.0,
        discount_type: Optional[str] = None,  # 'percentage' or 'amount'
        discount_value: Optional[float] = None,
        tax_amount: float = 0.0,
        tax_rate: float = 0.0,
        total_amount: Optional[float] = None,
        currency: str = "USD",
        payment_status: Optional[BookingPaymentStatusEnum] = None,
        due_balance: Optional[float] = None,
        reserved_until: Optional[datetime] = None,
        cancelled_at: Optional[datetime] = None,
        cancellation_reason: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = booking_id or generate_id()
        self.tenant_id = tenant_id
        self.event_id = event_id
        self.booking_number = booking_number or self._generate_booking_number()
        self.customer_id = customer_id
        self.status = status
        self.currency = currency
        
        # Validate and set items
        if not items:
            raise ValidationError("Booking must have at least one item")
        self.items = items
        
        # Calculate amounts
        calculated_subtotal = sum(item.total_price for item in items)
        self.subtotal_amount = subtotal_amount if subtotal_amount is not None else calculated_subtotal
        self.discount_amount = discount_amount
        self.discount_type = discount_type
        self.discount_value = discount_value
        
        # Calculate amount after discount
        amount_after_discount = self.subtotal_amount - self.discount_amount
        
        # Calculate tax
        self.tax_rate = tax_rate
        calculated_tax = amount_after_discount * tax_rate if tax_rate > 0 else 0.0
        self.tax_amount = tax_amount if tax_amount > 0 else calculated_tax
        
        # Calculate total
        calculated_total = amount_after_discount + self.tax_amount
        self.total_amount = total_amount if total_amount is not None else calculated_total
        
        # Payment
        self.payment_status = payment_status
        # Due balance defaults to total_amount if not provided (for new bookings with no payments)
        self.due_balance = due_balance if due_balance is not None else self.total_amount
        
        # Reservation
        self.reserved_until = reserved_until or (now + timedelta(minutes=15))  # Default 15 min reservation
        
        # Cancellation
        self.cancelled_at = cancelled_at
        self.cancellation_reason = cancellation_reason
        
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now
        
        self._validate()
    
    def _generate_booking_number(self) -> str:
        """Generate a unique booking number.
        
        Note: This method is kept for backward compatibility but should not be used.
        Booking numbers should be generated in the handler using year-based sequences.
        """
        # Format: BK-YYYYMMDD-HHMMSS-XXXX (fallback format)
        now = datetime.now(timezone.utc)
        timestamp = now.strftime("%Y%m%d-%H%M%S")
        random_part = generate_id()[:4].upper()
        return f"BK-{timestamp}-{random_part}"
    
    def apply_discount(
        self,
        discount_type: str,
        discount_value: float,
    ) -> None:
        """Apply discount to the booking."""
        if discount_type not in ["percentage", "amount"]:
            raise ValidationError("Discount type must be 'percentage' or 'amount'")
        
        if discount_value < 0:
            raise ValidationError("Discount value cannot be negative")
        
        if discount_type == "percentage":
            if discount_value > 100:
                raise ValidationError("Discount percentage cannot exceed 100%")
            self.discount_amount = (self.subtotal_amount * discount_value) / 100
        else:  # amount
            if discount_value > self.subtotal_amount:
                raise ValidationError("Discount amount cannot exceed subtotal")
            self.discount_amount = discount_value
        
        self.discount_type = discount_type
        self.discount_value = discount_value
        
        # Recalculate total
        amount_after_discount = self.subtotal_amount - self.discount_amount
        self.tax_amount = amount_after_discount * self.tax_rate
        self.total_amount = amount_after_discount + self.tax_amount
        
        self._touch()
    
    def apply_tax(self, tax_rate: float) -> None:
        """Apply tax rate to the booking."""
        if tax_rate < 0 or tax_rate > 1:
            raise ValidationError("Tax rate must be between 0 and 1")
        
        self.tax_rate = tax_rate
        amount_after_discount = self.subtotal_amount - self.discount_amount
        self.tax_amount = amount_after_discount * tax_rate
        self.total_amount = amount_after_discount + self.tax_amount
        
        self._touch()
    
    def confirm(self) -> None:
        """Confirm the booking."""
        if self.status != BookingStatusEnum.RESERVED:
            raise BusinessRuleError("Only reserved bookings can be confirmed")
        self.status = BookingStatusEnum.CONFIRMED
        self._touch()
    
    def mark_as_paid(self) -> None:
        """Mark booking as paid. Payment details are handled by a separate payment table."""
        # Allow payment for PENDING (direct agency bookings), RESERVED, or CONFIRMED statuses
        if self.status not in [BookingStatusEnum.PENDING, BookingStatusEnum.CONFIRMED, BookingStatusEnum.RESERVED]:
            raise BusinessRuleError("Booking must be pending, confirmed, or reserved before payment")
        
        self.status = BookingStatusEnum.PAID
        self.payment_status = BookingPaymentStatusEnum.PAID
        self.reserved_until = None  # Clear reservation timeout
        
        self._touch()
    
    def cancel(self, reason: Optional[str] = None) -> None:
        """Cancel the booking. Only pending bookings without payments can be cancelled."""
        if self.status == BookingStatusEnum.CANCELLED:
            raise BusinessRuleError("Booking is already cancelled.")
        if self.status != BookingStatusEnum.PENDING:
            raise BusinessRuleError(f"Only pending bookings can be cancelled. Current status: {self.status.value}")
        
        # Check if booking has any payments (partial or full)
        # payment_status will be PROCESSING (partial) or PAID (full) if payments exist
        if self.payment_status and self.payment_status != BookingPaymentStatusEnum.PENDING:
            raise BusinessRuleError(
                f"Cannot cancel booking with payments. Booking has payment status: {self.payment_status.value}. "
                f"Only bookings without payments (pending payment status) can be cancelled."
            )
        
        self.status = BookingStatusEnum.CANCELLED
        self.cancelled_at = datetime.now(timezone.utc)
        self.cancellation_reason = reason
        self.reserved_until = None
        
        self._touch()
    
    def refund(self, reason: Optional[str] = None) -> None:
        """Refund a paid booking."""
        if self.status != BookingStatusEnum.PAID:
            raise BusinessRuleError("Only paid bookings can be refunded")
        
        self.status = BookingStatusEnum.REFUNDED
        self.payment_status = BookingPaymentStatusEnum.REFUNDED
        self.cancelled_at = datetime.now(timezone.utc)
        self.cancellation_reason = reason
        self.reserved_until = None
        
        self._touch()
    
    def reserve(self, minutes: int = 15) -> None:
        """Reserve the booking for a specified time period."""
        if self.status != BookingStatusEnum.PENDING:
            raise BusinessRuleError("Only pending bookings can be reserved")
        
        self.status = BookingStatusEnum.RESERVED
        self.reserved_until = datetime.now(timezone.utc) + timedelta(minutes=minutes)
        
        self._touch()
    
    def add_item(self, item: BookingItem) -> None:
        """Add an item to the booking."""
        if self.status in [BookingStatusEnum.PAID, BookingStatusEnum.REFUNDED]:
            raise BusinessRuleError("Cannot add items to paid or refunded bookings")
        
        self.items.append(item)
        self._recalculate_amounts()
        self._touch()
    
    def remove_item(self, item_id: str) -> None:
        """Remove an item from the booking."""
        if self.status in [BookingStatusEnum.PAID, BookingStatusEnum.REFUNDED]:
            raise BusinessRuleError("Cannot remove items from paid or refunded bookings")
        
        self.items = [item for item in self.items if item.id != item_id]
        if not self.items:
            raise BusinessRuleError("Booking must have at least one item")
        
        self._recalculate_amounts()
        self._touch()
    
    def _recalculate_amounts(self) -> None:
        """Recalculate all amounts based on current items and discounts."""
        self.subtotal_amount = sum(item.total_price for item in self.items)
        
        # Reapply discount if exists
        if self.discount_type and self.discount_value is not None:
            if self.discount_type == "percentage":
                self.discount_amount = (self.subtotal_amount * self.discount_value) / 100
            else:
                self.discount_amount = min(self.discount_value, self.subtotal_amount)
        else:
            self.discount_amount = 0.0
        
        # Recalculate tax and total
        amount_after_discount = self.subtotal_amount - self.discount_amount
        self.tax_amount = amount_after_discount * self.tax_rate
        self.total_amount = amount_after_discount + self.tax_amount
        # Note: due_balance should be updated separately when payments are made
    
    def _validate(self) -> None:
        """Validate booking transaction data and business rules."""
        if not self.tenant_id:
            raise ValidationError("Tenant ID is required")
        if not self.event_id:
            raise ValidationError("Event ID is required")
        if not self.booking_number:
            raise ValidationError("Booking number is required")
        if not self.items:
            raise ValidationError("Booking must have at least one item")
        if self.total_amount < 0:
            raise ValidationError("Total amount cannot be negative")
        if self.tax_rate < 0 or self.tax_rate > 1:
            raise ValidationError("Tax rate must be between 0 and 1")
    
    def _touch(self) -> None:
        """Update the updated_at timestamp and increment version."""
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()


def ensure_same_tenant(booking: Booking, tenant_id: str) -> None:
    """Ensure booking belongs to the specified tenant."""
    if booking.tenant_id != tenant_id:
        raise BusinessRuleError("Booking tenant mismatch")

