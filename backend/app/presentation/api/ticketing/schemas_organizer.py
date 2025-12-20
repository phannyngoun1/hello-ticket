"""Pydantic schemas for Ticketing APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class OrganizerCreateRequest(BaseModel):
    """Payload for organizer creation"""

    code: Optional[str] = Field(None, description="Organizer business code (auto-generated)")
    name: str = Field(..., description="Display name for the organizer")


class OrganizerUpdateRequest(BaseModel):
    """Payload for organizer updates"""

    code: Optional[str] = Field(None, description="Organizer business code")
    name: Optional[str] = Field(None, description="Display name for the organizer")


class OrganizerResponse(BaseModel):
    """Organizer response model"""

    id: str
    tenant_id: str
    code: str
    name: str

    is_active: bool
    created_at: datetime
    updated_at: datetime
    deactivated_at: Optional[datetime]


class OrganizerListResponse(BaseModel):
    """Paginated organizer list response"""

    items: List[OrganizerResponse]
    skip: int
    limit: int
    total: int
    has_next: bool

