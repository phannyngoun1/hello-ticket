"""Pydantic schemas for Sales APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class TestTreeCreateRequest(BaseModel):
    """Payload for test_tree creation"""

    code: str = Field(..., description="TestTree business code")
    name: str = Field(..., description="Display name for the test_tree")
    parent_test_tree_id: Optional[str] = Field(None, description="Parent test_tree ID for hierarchy")
    sort_order: int = Field(0, description="Sort order for display")


class TestTreeUpdateRequest(BaseModel):
    """Payload for test_tree updates"""

    code: Optional[str] = Field(None, description="TestTree business code")
    name: Optional[str] = Field(None, description="Display name for the test_tree")
    parent_test_tree_id: Optional[str] = Field(None, description="Parent test_tree ID for hierarchy")
    sort_order: Optional[int] = Field(None, description="Sort order for display")


class TestTreeResponse(BaseModel):
    """TestTree response model"""

    id: str
    tenant_id: str
    code: str
    name: str
    parent_test_tree_id: Optional[str]
    level: int
    sort_order: int

    is_active: bool
    created_at: datetime
    updated_at: datetime
    deactivated_at: Optional[datetime]


class TestTreeListResponse(BaseModel):
    """Paginated test_tree list response"""

    items: List[TestTreeResponse]
    skip: int
    limit: int
    total: int
    has_next: bool


class TestTreeTreeResponse(TestTreeResponse):
    """Schema for test_tree tree response with children"""
    children: List["TestTreeTreeResponse"] = Field(default_factory=list)
    children_count: int = 0
    has_children: bool = False


TestTreeTreeResponse.model_rebuild()

