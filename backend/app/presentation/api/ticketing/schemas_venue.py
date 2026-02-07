"""Pydantic schemas for Ticketing APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class VenueCreateRequest(BaseModel):
    """Payload for venue creation"""

    code: Optional[str] = Field(None, description="Venue business code (auto-generated)")
    name: str = Field(..., description="Display name for the venue")
    description: Optional[str] = Field(None, description="Venue description")
    image_url: Optional[str] = Field(None, description="URL for venue seat map image")
    venue_type: Optional[str] = Field(None, description="Venue type (Theater, Stadium, Concert Hall, etc.)")
    capacity: Optional[int] = Field(None, description="Total seating capacity")
    parking_info: Optional[str] = Field(None, description="Parking availability/details")
    accessibility: Optional[str] = Field(None, description="Accessibility features")
    amenities: Optional[List[str]] = Field(None, description="List of amenities (WiFi, concessions, etc.)")
    opening_hours: Optional[str] = Field(None, description="Operating hours")
    phone: Optional[str] = Field(None, description="Contact phone number")
    email: Optional[str] = Field(None, description="Contact email address")
    website: Optional[str] = Field(None, description="Venue website URL")
    street_address: Optional[str] = Field(None, description="Street address")
    city: Optional[str] = Field(None, description="City")
    state_province: Optional[str] = Field(None, description="State or province")
    postal_code: Optional[str] = Field(None, description="Postal/ZIP code")
    country: Optional[str] = Field(None, description="Country")


class VenueUpdateRequest(BaseModel):
    """Payload for venue updates"""

    code: Optional[str] = Field(None, description="Venue business code")
    name: Optional[str] = Field(None, description="Display name for the venue")
    description: Optional[str] = Field(None, description="Venue description")
    image_url: Optional[str] = Field(None, description="URL for venue seat map image")
    venue_type: Optional[str] = Field(None, description="Venue type (Theater, Stadium, Concert Hall, etc.)")
    capacity: Optional[int] = Field(None, description="Total seating capacity")
    parking_info: Optional[str] = Field(None, description="Parking availability/details")
    accessibility: Optional[str] = Field(None, description="Accessibility features")
    amenities: Optional[List[str]] = Field(None, description="List of amenities (WiFi, concessions, etc.)")
    opening_hours: Optional[str] = Field(None, description="Operating hours")
    phone: Optional[str] = Field(None, description="Contact phone number")
    email: Optional[str] = Field(None, description="Contact email address")
    website: Optional[str] = Field(None, description="Venue website URL")
    street_address: Optional[str] = Field(None, description="Street address")
    city: Optional[str] = Field(None, description="City")
    state_province: Optional[str] = Field(None, description="State or province")
    postal_code: Optional[str] = Field(None, description="Postal/ZIP code")
    country: Optional[str] = Field(None, description="Country")


class VenueResponse(BaseModel):
    """Venue response model"""

    id: str
    tenant_id: str
    code: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    venue_type: Optional[str] = None
    capacity: Optional[int] = None
    parking_info: Optional[str] = None
    accessibility: Optional[str] = None
    amenities: Optional[List[str]] = None
    opening_hours: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
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

