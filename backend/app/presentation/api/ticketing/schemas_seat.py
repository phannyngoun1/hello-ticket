"""Pydantic schemas for Seat APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from app.domain.ticketing.seat import SeatType


class SeatCreateRequest(BaseModel):
    """Payload for seat creation"""

    venue_id: str = Field(..., description="Venue ID")
    layout_id: str = Field(..., description="Layout ID")
    section: str = Field(..., description="Section name (e.g., 'Section A')")
    row: str = Field(..., description="Row identifier (e.g., 'Row 5')")
    seat_number: str = Field(..., description="Seat number (e.g., '12')")
    seat_type: SeatType = Field(SeatType.STANDARD, description="Seat type")
    x_coordinate: Optional[float] = Field(None, description="X coordinate for seat map")
    y_coordinate: Optional[float] = Field(None, description="Y coordinate for seat map")


class SeatUpdateRequest(BaseModel):
    """Payload for seat updates"""

    section: Optional[str] = Field(None, description="Section name")
    row: Optional[str] = Field(None, description="Row identifier")
    seat_number: Optional[str] = Field(None, description="Seat number")
    seat_type: Optional[SeatType] = Field(None, description="Seat type")
    x_coordinate: Optional[float] = Field(None, description="X coordinate for seat map")
    y_coordinate: Optional[float] = Field(None, description="Y coordinate for seat map")


class SeatUpdateCoordinatesRequest(BaseModel):
    """Payload for updating seat coordinates"""

    x_coordinate: float = Field(..., description="X coordinate for seat map")
    y_coordinate: float = Field(..., description="Y coordinate for seat map")


class SeatResponse(BaseModel):
    """Seat response model"""

    id: str
    tenant_id: str
    venue_id: str
    layout_id: str
    section: str
    row: str
    seat_number: str
    seat_type: SeatType
    x_coordinate: Optional[float]
    y_coordinate: Optional[float]
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
