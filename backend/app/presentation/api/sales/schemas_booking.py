"""Pydantic schemas for Sales APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class BookingCreateRequest(BaseModel):
    """Payload for booking creation"""

    code: Optional[str] = Field(None, description="Booking business code (auto-generated)")
    name: str = Field(..., description="Display name for the booking")


class BookingUpdateRequest(BaseModel):
    """Payload for booking updates"""

    code: Optional[str] = Field(None, description="Booking business code")
    name: Optional[str] = Field(None, description="Display name for the booking")


class BookingResponse(BaseModel):
    """Booking response model"""

    id: str
    tenant_id: str
    code: str
    name: str

    is_active: bool
    created_at: datetime
    updated_at: datetime
    deactivated_at: Optional[datetime]


class BookingListResponse(BaseModel):
    """Paginated booking list response"""

    items: List[BookingResponse]
    skip: int
    limit: int
    total: int
    has_next: bool

