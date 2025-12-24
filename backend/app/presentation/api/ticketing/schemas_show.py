"""Pydantic schemas for Ticketing APIs"""
from datetime import datetime, date
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

class ShowCreateRequest(BaseModel):
    """Payload for show creation"""

    code: Optional[str] = Field(None, description="Show business code (auto-generated)")
    name: str = Field(..., description="Display name for the show")
    organizer_id: Optional[str] = Field(None, description="Organizer identifier")
    started_date: Optional[date] = Field(None, description="Show start date")
    ended_date: Optional[date] = Field(None, description="Show end date")
    note: Optional[str] = Field(None, max_length=5000, description="Show note")


class ShowUpdateRequest(BaseModel):
    """Payload for show updates"""

    code: Optional[str] = Field(None, description="Show business code")
    name: Optional[str] = Field(None, description="Display name for the show")
    organizer_id: Optional[str] = Field(None, description="Organizer identifier")
    started_date: Optional[date] = Field(None, description="Show start date")
    ended_date: Optional[date] = Field(None, description="Show end date")
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

