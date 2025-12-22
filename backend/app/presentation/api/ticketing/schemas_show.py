"""Pydantic schemas for Ticketing APIs"""
from datetime import datetime, date
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.shared.enums import ShowImageTypeEnum


class ShowImage(BaseModel):
    """Show image model"""
    url: str = Field(..., description="Image URL")
    type: ShowImageTypeEnum = Field(..., description="Image type")


class ShowCreateRequest(BaseModel):
    """Payload for show creation"""

    code: Optional[str] = Field(None, description="Show business code (auto-generated)")
    name: str = Field(..., description="Display name for the show")
    organizer_id: Optional[str] = Field(None, description="Organizer identifier")
    started_date: Optional[date] = Field(None, description="Show start date")
    ended_date: Optional[date] = Field(None, description="Show end date")
    images: Optional[List[ShowImage]] = Field(None, description="List of show images with types")
    note: Optional[str] = Field(None, max_length=5000, description="Show note")


class ShowUpdateRequest(BaseModel):
    """Payload for show updates"""

    code: Optional[str] = Field(None, description="Show business code")
    name: Optional[str] = Field(None, description="Display name for the show")
    organizer_id: Optional[str] = Field(None, description="Organizer identifier")
    started_date: Optional[date] = Field(None, description="Show start date")
    ended_date: Optional[date] = Field(None, description="Show end date")
    images: Optional[List[ShowImage]] = Field(None, description="List of show images with types")
    note: Optional[str] = Field(None, max_length=5000, description="Show note")


class ShowResponse(BaseModel):
    """Show response model"""

    id: str
    tenant_id: str
    code: str
    name: str
    organizer_id: Optional[str] = None
    is_active: bool
    started_date: Optional[date] = None
    ended_date: Optional[date] = None
    images: List[ShowImage] = Field(default_factory=list, description="List of show images with types")
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deactivated_at: Optional[datetime]

    class Config:
        use_enum_values = True


class ShowListResponse(BaseModel):
    """Paginated show list response"""

    items: List[ShowResponse]
    skip: int
    limit: int
    total: int
    has_next: bool

