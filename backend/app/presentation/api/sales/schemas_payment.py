"""Pydantic schemas for Payment APIs"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.shared.enums import PaymentMethodEnum, PaymentStatusEnum


class PaymentCreateRequest(BaseModel):
    """Payload for payment creation"""
    booking_id: str = Field(..., description="Booking ID to settle")
    amount: float = Field(..., gt=0, description="Payment amount (must be greater than 0)")
    payment_method: PaymentMethodEnum = Field(..., description="Payment method")
    currency: str = Field("USD", description="Currency code")
    transaction_reference: Optional[str] = Field(None, description="External transaction reference")
    notes: Optional[str] = Field(None, description="Payment notes")


class PaymentResponse(BaseModel):
    """Payment response model"""
    id: str
    tenant_id: str
    booking_id: str
    amount: float
    currency: str
    payment_method: str
    status: str
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    version: Optional[int] = 0


class PaymentListResponse(BaseModel):
    """Paginated payment list response"""
    items: list[PaymentResponse]
    total: int
    has_next: bool

