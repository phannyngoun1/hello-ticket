"""Pydantic schemas for Ticketing APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class OrganizerCreateRequest(BaseModel):
    """Payload for organizer creation"""

    code: Optional[str] = Field(None, description="Organizer business code (auto-generated)")
    name: str = Field(..., description="Display name for the organizer")
    description: Optional[str] = Field(None, description="Detailed description")
    email: Optional[str] = Field(None, description="Contact email")
    phone: Optional[str] = Field(None, description="Contact phone")
    website: Optional[str] = Field(None, description="Website URL")
    address: Optional[str] = Field(None, description="Physical address")
    city: Optional[str] = Field(None, description="City")
    country: Optional[str] = Field(None, description="Country")
    logo: Optional[str] = Field(None, description="Logo URL")
    tags: Optional[List[str]] = Field(None, description="List of tags")


class OrganizerUpdateRequest(BaseModel):
    """Payload for organizer updates"""

    code: Optional[str] = Field(None, description="Organizer business code")
    name: Optional[str] = Field(None, description="Display name for the organizer")
    description: Optional[str] = Field(None, description="Detailed description")
    email: Optional[str] = Field(None, description="Contact email")
    phone: Optional[str] = Field(None, description="Contact phone")
    website: Optional[str] = Field(None, description="Website URL")
    address: Optional[str] = Field(None, description="Physical address")
    city: Optional[str] = Field(None, description="City")
    country: Optional[str] = Field(None, description="Country")
    logo: Optional[str] = Field(None, description="Logo URL")
    tags: Optional[List[str]] = Field(None, description="List of tags")


class OrganizerResponse(BaseModel):
    """Organizer response model"""

    id: str
    tenant_id: str
    code: str
    name: str
    description: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    logo: Optional[str] = None
    tags: List[str] = []

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

