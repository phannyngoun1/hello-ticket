"""Pydantic schemas for Ticketing APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ShowCreateRequest(BaseModel):
    """Payload for show creation"""

    code: Optional[str] = Field(None, description="Show business code (auto-generated)")
    name: str = Field(..., description="Display name for the show")


class ShowUpdateRequest(BaseModel):
    """Payload for show updates"""

    code: Optional[str] = Field(None, description="Show business code")
    name: Optional[str] = Field(None, description="Display name for the show")


class ShowResponse(BaseModel):
    """Show response model"""

    id: str
    tenant_id: str
    code: str
    name: str

    is_active: bool
    created_at: datetime
    updated_at: datetime
    deactivated_at: Optional[datetime]


class ShowListResponse(BaseModel):
    """Paginated show list response"""

    items: List[ShowResponse]
    skip: int
    limit: int
    total: int
    has_next: bool

