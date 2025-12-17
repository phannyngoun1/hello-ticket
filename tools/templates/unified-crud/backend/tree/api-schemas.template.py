"""Pydantic schemas for {{ModuleName}} APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class {{EntityName}}CreateRequest(BaseModel):
    """Payload for {{EntityNameLower}} creation"""

{{CreateRequestCodeField}}
    name: str = Field(..., description="Display name for the {{EntityNameLower}}")
    parent_{{EntityNameLower}}_id: Optional[str] = Field(None, description="Parent {{EntityNameLower}} ID for hierarchy")
    sort_order: int = Field(0, description="Sort order for display")
{{CreateRequestFields}}

class {{EntityName}}UpdateRequest(BaseModel):
    """Payload for {{EntityNameLower}} updates"""

    code: Optional[str] = Field(None, description="{{EntityName}} business code")
    name: Optional[str] = Field(None, description="Display name for the {{EntityNameLower}}")
    parent_{{EntityNameLower}}_id: Optional[str] = Field(None, description="Parent {{EntityNameLower}} ID for hierarchy")
    sort_order: Optional[int] = Field(None, description="Sort order for display")
{{UpdateRequestFields}}

class {{EntityName}}Response(BaseModel):
    """{{EntityName}} response model"""

    id: str
    tenant_id: str
    code: str
    name: str
    parent_{{EntityNameLower}}_id: Optional[str]
    level: int
    sort_order: int
{{ResponseFields}}
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deactivated_at: Optional[datetime]


class {{EntityName}}ListResponse(BaseModel):
    """Paginated {{EntityNameLower}} list response"""

    items: List[{{EntityName}}Response]
    skip: int
    limit: int
    total: int
    has_next: bool


class {{EntityName}}TreeResponse({{EntityName}}Response):
    """Schema for {{EntityNameLower}} tree response with children"""
    children: List["{{EntityName}}TreeResponse"] = Field(default_factory=list)
    children_count: int = 0
    has_children: bool = False


{{EntityName}}TreeResponse.model_rebuild()

