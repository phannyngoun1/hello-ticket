"""Pydantic schemas for {{ModuleName}} APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class {{EntityName}}CreateRequest(BaseModel):
    """Payload for {{EntityNameLower}} creation"""

{{CreateRequestCodeField}}
    name: str = Field(..., description="Display name for the {{EntityNameLower}}")
{{CreateRequestFields}}

class {{EntityName}}UpdateRequest(BaseModel):
    """Payload for {{EntityNameLower}} updates"""

    code: Optional[str] = Field(None, description="{{EntityName}} business code")
    name: Optional[str] = Field(None, description="Display name for the {{EntityNameLower}}")
{{UpdateRequestFields}}

class {{EntityName}}Response(BaseModel):
    """{{EntityName}} response model"""

    id: str
    tenant_id: str
    code: str
    name: str
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

