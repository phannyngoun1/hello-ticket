"""Pydantic schemas for Ticketing APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.shared.enums import EventStatusEnum


class EventCreateRequest(BaseModel):
    """Payload for event creation"""

    show_id: str = Field(..., description="Show identifier")
    title: str = Field(..., description="Event title")
    start_dt: datetime = Field(..., description="Event start datetime")
    duration_minutes: int = Field(..., ge=1, le=1440, description="Duration in minutes (1-1440)")
    venue_id: str = Field(..., description="Venue identifier")
    layout_id: Optional[str] = Field(None, description="Venue layout identifier")
    status: EventStatusEnum = Field(default=EventStatusEnum.DRAFT, description="Event status")


class EventUpdateRequest(BaseModel):
    """Payload for event updates"""

    title: Optional[str] = Field(None, description="Event title")
    start_dt: Optional[datetime] = Field(None, description="Event start datetime")
    duration_minutes: Optional[int] = Field(None, ge=1, le=1440, description="Duration in minutes (1-1440)")
    venue_id: Optional[str] = Field(None, description="Venue identifier")
    layout_id: Optional[str] = Field(None, description="Venue layout identifier")
    status: Optional[EventStatusEnum] = Field(None, description="Event status")


class EventResponse(BaseModel):
    """Event response model"""

    id: str
    tenant_id: str
    show_id: str
    title: str
    start_dt: datetime
    duration_minutes: int
    venue_id: str
    layout_id: Optional[str] = None
    status: EventStatusEnum
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        use_enum_values = True


class EventListResponse(BaseModel):
    """Paginated event list response"""

    items: List[EventResponse]
    skip: int
    limit: int
    total: int
    has_next: bool

