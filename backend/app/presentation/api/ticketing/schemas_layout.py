"""Pydantic schemas for Layout APIs"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

# Import SeatResponse for forward reference
from app.presentation.api.ticketing.schemas_seat import SeatResponse


class LayoutCreateRequest(BaseModel):
    """Payload for layout creation"""

    venue_id: str = Field(..., description="Venue ID")
    name: str = Field(..., description="Layout name")
    description: Optional[str] = Field(None, description="Layout description")
    file_id: Optional[str] = Field(None, description="File ID for layout seat map image")


class LayoutUpdateRequest(BaseModel):
    """Payload for layout updates"""

    name: Optional[str] = Field(None, description="Layout name")
    description: Optional[str] = Field(None, description="Layout description")
    file_id: Optional[str] = Field(None, description="File ID for layout seat map image")


class LayoutResponse(BaseModel):
    """Layout response model"""

    id: str
    tenant_id: str
    venue_id: str
    name: str
    description: Optional[str] = None
    file_id: Optional[str] = None
    image_url: Optional[str] = None  # URL to the layout image file (from file_id)
    is_active: bool
    created_at: datetime
    updated_at: datetime


class LayoutListResponse(BaseModel):
    """List of layouts response"""

    items: List[LayoutResponse]


class LayoutWithSeatsResponse(BaseModel):
    """Layout response with seats included"""

    layout: LayoutResponse
    seats: List[SeatResponse] = Field(..., description="List of seats for this layout")
