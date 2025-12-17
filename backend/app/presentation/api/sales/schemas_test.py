"""Pydantic schemas for Sales APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class TestCreateRequest(BaseModel):
    """Payload for test creation"""

    code: Optional[str] = Field(None, description="Test business code (auto-generated)")
    name: str = Field(..., description="Display name for the test")


class TestUpdateRequest(BaseModel):
    """Payload for test updates"""

    code: Optional[str] = Field(None, description="Test business code")
    name: Optional[str] = Field(None, description="Display name for the test")


class TestResponse(BaseModel):
    """Test response model"""

    id: str
    tenant_id: str
    code: str
    name: str

    is_active: bool
    created_at: datetime
    updated_at: datetime
    deactivated_at: Optional[datetime]


class TestListResponse(BaseModel):
    """Paginated test list response"""

    items: List[TestResponse]
    skip: int
    limit: int
    total: int
    has_next: bool

