"""Pydantic schemas for Ticketing APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class VenueTypeCreateRequest(BaseModel):
    """Payload for venue_type creation"""

    code: str = Field(..., description="VenueType business code")
    name: str = Field(..., description="Display name for the venue_type")


class VenueTypeUpdateRequest(BaseModel):
    """Payload for venue_type updates"""

    code: Optional[str] = Field(None, description="VenueType business code")
    name: Optional[str] = Field(None, description="Display name for the venue_type")


class VenueTypeResponse(BaseModel):
    """VenueType response model"""

    id: str
    tenant_id: str
    code: str
    name: str

    is_active: bool
    created_at: datetime
    updated_at: datetime


class VenueTypeListResponse(BaseModel):
    """Paginated venue_type list response"""

    items: List[VenueTypeResponse]
    skip: int
    limit: int
    total: int
    has_next: bool

