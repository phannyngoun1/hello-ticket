"""Pydantic schemas for Ticketing APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class EventTypeCreateRequest(BaseModel):
    """Payload for event_type creation"""

    code: str = Field(..., description="EventType business code")
    name: str = Field(..., description="Display name for the event_type")


class EventTypeUpdateRequest(BaseModel):
    """Payload for event_type updates"""

    code: Optional[str] = Field(None, description="EventType business code")
    name: Optional[str] = Field(None, description="Display name for the event_type")


class EventTypeResponse(BaseModel):
    """EventType response model"""

    id: str
    tenant_id: str
    code: str
    name: str

    is_active: bool
    created_at: datetime
    updated_at: datetime


class EventTypeListResponse(BaseModel):
    """Paginated event_type list response"""

    items: List[EventTypeResponse]
    skip: int
    limit: int
    total: int
    has_next: bool

