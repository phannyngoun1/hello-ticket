"""Sales commands for CQRS pattern - Payment"""
from dataclasses import dataclass
from app.shared.enums import PaymentMethodEnum


@dataclass
class CreatePaymentCommand:
    """Command to create a payment for a booking"""
    booking_id: str
    amount: float
    payment_method: PaymentMethodEnum
    currency: str = "USD"
    transaction_reference: str | None = None
    notes: str | None = None

