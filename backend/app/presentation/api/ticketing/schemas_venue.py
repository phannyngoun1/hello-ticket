"""Pydantic schemas for Ticketing APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class VenueCreateRequest(BaseModel):
    """Payload for venue creation"""

    code: Optional[str] = Field(None, description="Venue business code (auto-generated)")
    name: str = Field(..., description="Display name for the venue")


class VenueUpdateRequest(BaseModel):
    """Payload for venue updates"""

    code: Optional[str] = Field(None, description="Venue business code")
    name: Optional[str] = Field(None, description="Display name for the venue")
    image_url: Optional[str] = Field(None, description="URL for venue seat map image")


class VenueResponse(BaseModel):
    """Venue response model"""

    id: str
    tenant_id: str
    code: str
    name: str
    image_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deactivated_at: Optional[datetime]


class VenueListResponse(BaseModel):
    """Paginated venue list response"""

    items: List[VenueResponse]
    skip: int
    limit: int
    total: int
    has_next: bool

