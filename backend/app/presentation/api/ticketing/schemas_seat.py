"""Pydantic schemas for Seat APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
import json

from pydantic import BaseModel, Field, field_validator
from app.domain.ticketing.seat import SeatType


class SeatCreateRequest(BaseModel):
    """Payload for seat creation"""

    venue_id: str = Field(..., description="Venue ID")
    layout_id: str = Field(..., description="Layout ID")
    section_id: str = Field(..., description="Section ID reference")
    row: str = Field(..., description="Row identifier (e.g., 'Row 5')")
    seat_number: str = Field(..., description="Seat number (e.g., '12')")
    seat_type: SeatType = Field(SeatType.STANDARD, description="Seat type")
    x_coordinate: Optional[float] = Field(None, description="X coordinate for seat map")
    y_coordinate: Optional[float] = Field(None, description="Y coordinate for seat map")
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


class SeatUpdateRequest(BaseModel):
    """Payload for seat updates"""

    section_id: Optional[str] = Field(None, description="Section ID reference")
    row: Optional[str] = Field(None, description="Row identifier")
    seat_number: Optional[str] = Field(None, description="Seat number")
    seat_type: Optional[SeatType] = Field(None, description="Seat type")
    x_coordinate: Optional[float] = Field(None, description="X coordinate for seat map")
    y_coordinate: Optional[float] = Field(None, description="Y coordinate for seat map")
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


class SeatUpdateCoordinatesRequest(BaseModel):
    """Payload for updating seat coordinates"""

    x_coordinate: float = Field(..., description="X coordinate for seat map")
    y_coordinate: float = Field(..., description="Y coordinate for seat map")
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


class SeatResponse(BaseModel):
    """Seat response model"""

    id: str
    tenant_id: str
    venue_id: str
    layout_id: str
    section_id: str
    section_name: Optional[str] = None  # Include section name for display
    row: str
    seat_number: str
    seat_type: SeatType
    x_coordinate: Optional[float]
    y_coordinate: Optional[float]
    shape: Optional[str] = None  # JSON string storing PlacementShape data
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SeatListResponse(BaseModel):
    """Paginated seat list response"""

    items: List[SeatResponse]
    skip: int
    limit: int
    total: int
    has_next: bool


class BulkSeatCreateRequest(BaseModel):
    """Payload for bulk seat operations (create, update, delete)
    
    The 'seats' list contains all seat operations:
    - No 'id' field: Create new seat
    - Has 'id' field: Update existing seat  
    - Has 'id' field + 'delete' flag: Delete seat
    """

    seats: List[Dict[str, Any]] = Field(..., description="List of seat data dictionaries. Operation type determined by presence of 'id' and 'delete' flag")
    file_id: Optional[str] = Field(None, description="Optional file ID to update the layout's image file")
