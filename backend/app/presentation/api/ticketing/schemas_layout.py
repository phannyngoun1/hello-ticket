"""Pydantic schemas for Layout APIs"""
from datetime import datetime
from typing import List, Optional, Dict, Any, Union
import json

from pydantic import BaseModel, Field, field_validator

# Import SeatResponse for forward reference
from app.presentation.api.ticketing.schemas_seat import SeatResponse


class LayoutCreateRequest(BaseModel):
    """Payload for layout creation"""

    venue_id: str = Field(..., description="Venue ID")
    name: str = Field(..., description="Layout name")
    description: Optional[str] = Field(None, description="Layout description")
    file_id: Optional[str] = Field(None, description="File ID for layout seat map image")
    design_mode: Optional[str] = Field("seat-level", description="Design mode: seat-level or section-level")
    canvas_background_color: Optional[str] = Field(None, description="Canvas background color when no image (hex e.g. #e5e7eb)")
    marker_fill_transparency: Optional[float] = Field(1.0, description="Marker fill transparency for all seats (0.0 to 1.0)")


class LayoutUpdateRequest(BaseModel):
    """Payload for layout updates"""

    name: Optional[str] = Field(None, description="Layout name")
    description: Optional[str] = Field(None, description="Layout description")
    file_id: Optional[str] = Field(None, description="File ID for layout seat map image")
    canvas_background_color: Optional[str] = Field(None, description="Canvas background color when no image (hex e.g. #e5e7eb)")
    marker_fill_transparency: Optional[float] = Field(None, description="Marker fill transparency for all seats (0.0 to 1.0)")


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
    canvas_background_color: Optional[str] = None  # When no image (hex e.g. #e5e7eb)
    marker_fill_transparency: float = 1.0  # Marker fill transparency for all seats (0.0 to 1.0)
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
    canvas_background_color: Optional[str] = None  # Canvas background when no section image (hex e.g. #e5e7eb)
    marker_fill_transparency: Optional[float] = None  # Marker fill transparency for seats in this section (0.0 to 1.0)
    shape: Optional[str] = None  # JSON string storing PlacementShape data
    is_active: bool
    seat_count: Optional[int] = None  # Number of seats attached to this section
    created_at: datetime
    updated_at: datetime


class SectionCreateRequest(BaseModel):
    """Payload for section creation"""

    layout_id: str = Field(..., description="Layout ID")
    name: str = Field(..., description="Section name")
    x_coordinate: Optional[float] = Field(None, description="X coordinate on main floor plan")
    y_coordinate: Optional[float] = Field(None, description="Y coordinate on main floor plan")
    file_id: Optional[str] = Field(None, description="File ID for section floor plan image")
    canvas_background_color: Optional[str] = Field(None, description="Canvas background color when no section image (hex e.g. #e5e7eb)")
    marker_fill_transparency: Optional[float] = Field(None, description="Marker fill transparency for seats in this section (0.0 to 1.0)")
    shape: Optional[Union[Dict[str, Any], str]] = Field(None, description="Shape data as dict (PlacementShape) or JSON string")
    
    @field_validator('shape', mode='before')
    @classmethod
    def parse_shape(cls, v):
        """Parse shape from JSON string to dict if needed"""
        if v is None:
            return None
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return v  # Return as-is if not valid JSON
        return v  # Already a dict


class SectionUpdateRequest(BaseModel):
    """Payload for section updates"""

    name: Optional[str] = Field(None, description="Section name")
    x_coordinate: Optional[float] = Field(None, description="X coordinate on main floor plan")
    y_coordinate: Optional[float] = Field(None, description="Y coordinate on main floor plan")
    file_id: Optional[str] = Field(None, description="File ID for section floor plan image")
    canvas_background_color: Optional[str] = Field(None, description="Canvas background color when no section image (hex e.g. #e5e7eb)")
    marker_fill_transparency: Optional[float] = Field(None, description="Marker fill transparency for seats in this section (0.0 to 1.0)")
    shape: Optional[Union[Dict[str, Any], str]] = Field(None, description="Shape data as dict (PlacementShape) or JSON string")
    
    @field_validator('shape', mode='before')
    @classmethod
    def parse_shape(cls, v):
        """Parse shape from JSON string to dict if needed"""
        if v is None:
            return None
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return v  # Return as-is if not valid JSON
        return v  # Already a dict


class SectionListResponse(BaseModel):
    """List of sections response"""

    items: List[SectionResponse]


class LayoutWithSeatsResponse(BaseModel):
    """Layout response with seats included"""

    layout: LayoutResponse
    seats: List[SeatResponse] = Field(..., description="List of seats for this layout")
    sections: List[SectionResponse] = Field(default_factory=list, description="List of sections for this layout")
