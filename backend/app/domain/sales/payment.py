"""Payment aggregate for Sales - Represents a payment transaction for a booking."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from decimal import Decimal

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id
from app.shared.enums import PaymentStatusEnum, PaymentMethodEnum


class Payment(AggregateRoot):
    """Represents a payment transaction for a booking."""
    
    def __init__(
        self,
        tenant_id: str,
        booking_id: str,
        amount: float,
        payment_method: PaymentMethodEnum,
        payment_id: Optional[str] = None,
        payment_code: Optional[str] = None,
        status: PaymentStatusEnum = PaymentStatusEnum.PAID,
        currency: str = "USD",
        transaction_reference: Optional[str] = None,
        notes: Optional[str] = None,
        processed_at: Optional[datetime] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = payment_id or generate_id()
        self.tenant_id = tenant_id
        self.booking_id = booking_id
        self.payment_code = payment_code
        self.amount = amount
        self.payment_method = payment_method
        self.status = status
        self.currency = currency
        self.transaction_reference = transaction_reference
        self.notes = notes
        self.processed_at = processed_at
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now
        
        self._validate()
    
    def mark_as_completed(self) -> None:
        """Mark payment as completed."""
        if self.status == PaymentStatusEnum.VOID:
            raise BusinessRuleError("Cannot mark void payment as completed")
        self.status = PaymentStatusEnum.PAID
        self.processed_at = datetime.now(timezone.utc)
        self._touch()
    
    def void(self) -> None:
        """Void payment. Can only void completed payments."""
        if self.status == PaymentStatusEnum.VOID:
            raise BusinessRuleError("Payment is already void")
        if self.status != PaymentStatusEnum.PAID:
            raise BusinessRuleError(f"Only completed payments can be voided (current: {self.status})")
        self.status = PaymentStatusEnum.VOID
        self._touch()
    
    # Legacy method name - redirects to void()
    def cancel(self) -> None:
        """Cancel/void payment. Alias for void()."""
        self.void()
    
    def _validate(self) -> None:
        """Validate payment data."""
        if not self.tenant_id:
            raise ValidationError("Tenant ID is required")
        if not self.booking_id:
            raise ValidationError("Booking ID is required")
        if self.amount <= 0:
            raise ValidationError("Payment amount must be greater than zero")
        if not self.payment_method:
            raise ValidationError("Payment method is required")
    
    def _touch(self) -> None:
        """Update the updated_at timestamp and increment version."""
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()


def ensure_same_tenant(payment: Payment, tenant_id: str) -> None:
    """Ensure payment belongs to the specified tenant."""
    if payment.tenant_id != tenant_id:
        raise BusinessRuleError(f"Payment {payment.id} does not belong to tenant {tenant_id}")

