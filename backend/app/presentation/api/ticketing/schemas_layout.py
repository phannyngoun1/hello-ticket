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
    design_mode: Optional[str] = Field("seat-level", description="Design mode: seat-level or section-level")


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
    design_mode: str = "seat-level"
    is_active: bool
    created_at: datetime
    updated_at: datetime


class LayoutListResponse(BaseModel):
    """List of layouts response"""

    items: List[LayoutResponse]


class SectionResponse(BaseModel):
    """Section response model"""

    id: str
    tenant_id: str
    layout_id: str
    name: str
    x_coordinate: Optional[float] = None
    y_coordinate: Optional[float] = None
    file_id: Optional[str] = None
    image_url: Optional[str] = None  # URL to the section image file (from file_id)
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SectionCreateRequest(BaseModel):
    """Payload for section creation"""

    layout_id: str = Field(..., description="Layout ID")
    name: str = Field(..., description="Section name")
    x_coordinate: Optional[float] = Field(None, description="X coordinate on main floor plan")
    y_coordinate: Optional[float] = Field(None, description="Y coordinate on main floor plan")
    file_id: Optional[str] = Field(None, description="File ID for section floor plan image")


class SectionUpdateRequest(BaseModel):
    """Payload for section updates"""

    name: Optional[str] = Field(None, description="Section name")
    x_coordinate: Optional[float] = Field(None, description="X coordinate on main floor plan")
    y_coordinate: Optional[float] = Field(None, description="Y coordinate on main floor plan")
    file_id: Optional[str] = Field(None, description="File ID for section floor plan image")


class SectionListResponse(BaseModel):
    """List of sections response"""

    items: List[SectionResponse]


class LayoutWithSeatsResponse(BaseModel):
    """Layout response with seats included"""

    layout: LayoutResponse
    seats: List[SeatResponse] = Field(..., description="List of seats for this layout")
    sections: List[SectionResponse] = Field(default_factory=list, description="List of sections for this layout")
