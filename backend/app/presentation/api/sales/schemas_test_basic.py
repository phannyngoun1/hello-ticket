"""Pydantic schemas for Sales APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class TestBasicCreateRequest(BaseModel):
    """Payload for test_basic creation"""

    code: str = Field(..., description="TestBasic business code")
    name: str = Field(..., description="Display name for the test_basic")


class TestBasicUpdateRequest(BaseModel):
    """Payload for test_basic updates"""

    code: Optional[str] = Field(None, description="TestBasic business code")
    name: Optional[str] = Field(None, description="Display name for the test_basic")


class TestBasicResponse(BaseModel):
    """TestBasic response model"""

    id: str
    tenant_id: str
    code: str
    name: str

    is_active: bool
    created_at: datetime
    updated_at: datetime


class TestBasicListResponse(BaseModel):
    """Paginated test_basic list response"""

    items: List[TestBasicResponse]
    skip: int
    limit: int
    total: int
    has_next: bool

