"""Pydantic schemas for Ticketing APIs"""
from datetime import datetime, date
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ShowImageData(BaseModel):
    """Image data for show creation/update"""
    
    file_id: str = Field(..., description="File upload identifier")
    name: str = Field(..., description="Image name")
    description: Optional[str] = Field(None, max_length=1000, description="Image description")
    is_banner: bool = Field(False, description="Whether this image is a banner")


class ShowCreateRequest(BaseModel):
    """Payload for show creation"""

    code: Optional[str] = Field(None, description="Show business code (auto-generated)")
    name: str = Field(..., description="Display name for the show")
    organizer_id: Optional[str] = Field(None, description="Organizer identifier")
    started_date: Optional[date] = Field(None, description="Show start date")
    ended_date: Optional[date] = Field(None, description="Show end date")
    note: Optional[str] = Field(None, max_length=5000, description="Show note")
    images: Optional[List[ShowImageData]] = Field(None, description="List of show images")


class ShowUpdateRequest(BaseModel):
    """Payload for show updates"""

    code: Optional[str] = Field(None, description="Show business code")
    name: Optional[str] = Field(None, description="Display name for the show")
    organizer_id: Optional[str] = Field(None, description="Organizer identifier")
    started_date: Optional[date] = Field(None, description="Show start date")
    ended_date: Optional[date] = Field(None, description="Show end date")
    note: Optional[str] = Field(None, max_length=5000, description="Show note")
    images: Optional[List[ShowImageData]] = Field(None, description="List of show images (replaces all existing images)")


class ShowOrganizerResponse(BaseModel):
    """Minimal organizer response for nesting"""
    id: str
    code: str
    name: str


class ShowResponse(BaseModel):
    """Show response model"""

    id: str
    tenant_id: str
    code: str
    name: str
    organizer_id: Optional[str] = None
    organizer: Optional[ShowOrganizerResponse] = None
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


# Show Image Schemas
class ShowImageCreateRequest(BaseModel):
    """Payload for show image creation"""
    
    file_id: str = Field(..., description="File upload identifier")
    name: str = Field(..., description="Image name")
    description: Optional[str] = Field(None, max_length=1000, description="Image description")
    is_banner: bool = Field(False, description="Whether this image is a banner")


class ShowImageUpdateRequest(BaseModel):
    """Payload for show image updates"""
    
    name: Optional[str] = Field(None, description="Image name")
    description: Optional[str] = Field(None, max_length=1000, description="Image description")
    is_banner: Optional[bool] = Field(None, description="Whether this image is a banner")


class ShowImageResponse(BaseModel):
    """Show image response model"""
    
    id: str
    show_id: str
    tenant_id: str
    file_id: str
    file_url: Optional[str] = None
    name: str
    description: Optional[str] = None
    is_banner: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        use_enum_values = True

