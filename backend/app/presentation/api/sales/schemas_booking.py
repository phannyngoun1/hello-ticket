"""Pydantic schemas for Sales APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class BookingItemRequest(BaseModel):
    """Booking item request model"""
    event_seat_id: str
    section_name: Optional[str] = None
    row_name: Optional[str] = None
    seat_number: Optional[str] = None
    unit_price: float
    total_price: float
    currency: str = "USD"
    ticket_number: Optional[str] = None
    ticket_status: Optional[str] = None


class BookingCreateRequest(BaseModel):
    """Payload for booking creation"""
    event_id: str = Field(..., description="Event ID for the booking")
    customer_id: Optional[str] = Field(None, description="Customer ID (optional)")
    items: List[BookingItemRequest] = Field(..., description="List of booking items (tickets)")
    discount_type: Optional[str] = Field(None, description="Discount type: 'percentage' or 'amount'")
    discount_value: Optional[float] = Field(0, description="Discount value")
    tax_rate: Optional[float] = Field(0.1, description="Tax rate (e.g., 0.1 for 10%)")
    currency: str = Field("USD", description="Currency code")


class BookingUpdateRequest(BaseModel):
    """Payload for booking updates"""
    customer_id: Optional[str] = None
    status: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    payment_status: Optional[str] = None


class BookingItemResponse(BaseModel):
    """Booking item response model"""
    id: str
    event_seat_id: str
    ticket_id: Optional[str] = None
    section_name: Optional[str] = None
    row_name: Optional[str] = None
    seat_number: Optional[str] = None
    unit_price: float
    total_price: float
    currency: str
    ticket_number: Optional[str] = None
    ticket_status: Optional[str] = None


class BookingResponse(BaseModel):
    """Booking response model"""
    id: str
    tenant_id: str
    booking_number: str
    customer_id: Optional[str] = None
    event_id: str
    status: str
    subtotal_amount: float
    discount_amount: float
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    tax_amount: float
    tax_rate: float
    total_amount: float
    currency: str
    payment_status: Optional[str] = None
    reserved_until: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    items: List[BookingItemResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    version: Optional[int] = 0


class BookingListResponse(BaseModel):
    """Paginated booking list response"""

    items: List[BookingResponse]
    skip: int
    limit: int
    total: int
    has_next: bool

