"""Pydantic schemas for tag APIs"""
from typing import List, Optional
from pydantic import BaseModel, Field


class TagCreateRequest(BaseModel):
    """Payload for tag creation"""
    name: str = Field(..., description="Tag name")
    entity_type: str = Field(..., description="Entity type (e.g., 'customer', 'event')")
    description: Optional[str] = Field(None, description="Tag description")
    color: Optional[str] = Field(None, description="Hex color code for UI display")


class TagUpdateRequest(BaseModel):
    """Payload for tag updates"""
    name: Optional[str] = Field(None, description="Tag name")
    entity_type: Optional[str] = Field(None, description="Entity type")
    description: Optional[str] = Field(None, description="Tag description")
    color: Optional[str] = Field(None, description="Hex color code")


class TagResponse(BaseModel):
    """Tag response model"""
    id: str
    tenant_id: str
    name: str
    entity_type: str
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: bool
    created_at: str
    updated_at: str


class TagListResponse(BaseModel):
    """List of tags response"""
    items: List[TagResponse]
    total: int
    has_next: bool


class SetEntityTagsRequest(BaseModel):
    """Payload for setting tags on an entity"""
    tag_ids: List[str] = Field(..., description="List of tag IDs to link to the entity")


class GetOrCreateTagsRequest(BaseModel):
    """Payload for getting or creating tags by name"""
    tag_names: List[str] = Field(..., description="List of tag names to get or create")
    entity_type: str = Field(..., description="Entity type for the tags")


class GetOrCreateTagsResponse(BaseModel):
    """Response for get or create tags"""
    tag_ids: List[str] = Field(..., description="List of tag IDs (created or existing)")


class TagWithAttachmentStatus(TagResponse):
    """Tag with attachment status for an entity"""
    is_attached: bool = Field(..., description="Whether this tag is attached to the entity")


class GetAvailableTagsResponse(BaseModel):
    """Response for getting available tags with attachment status"""
    items: List[TagWithAttachmentStatus] = Field(..., description="List of tags with attachment status")
    total: int = Field(..., description="Total number of tags")


class ManageEntityTagsRequest(BaseModel):
    """Payload for managing entity tags - creates new tags and attaches them"""
    tag_names: List[str] = Field(..., description="List of tag names (will be created if they don't exist)")


class ManageEntityTagsResponse(BaseModel):
    """Response for managing entity tags"""
    tags: List[TagResponse] = Field(..., description="List of attached tags")
    created_count: int = Field(..., description="Number of new tags created")

