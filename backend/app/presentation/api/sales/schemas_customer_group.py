"""Pydantic schemas for Sales APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CustomerGroupCreateRequest(BaseModel):
    """Payload for customer_group creation"""

    code: str = Field(..., description="CustomerGroup business code")
    name: str = Field(..., description="Display name for the customer_group")
    parent_id: Optional[str] = Field(None, description="Parent customer_group ID for hierarchy")
    sort_order: int = Field(0, description="Sort order for display")


class CustomerGroupUpdateRequest(BaseModel):
    """Payload for customer_group updates"""

    code: Optional[str] = Field(None, description="CustomerGroup business code")
    name: Optional[str] = Field(None, description="Display name for the customer_group")
    parent_id: Optional[str] = Field(None, description="Parent customer_group ID for hierarchy")
    sort_order: Optional[int] = Field(None, description="Sort order for display")


class CustomerGroupResponse(BaseModel):
    """CustomerGroup response model"""

    id: str
    tenant_id: str
    code: str
    name: str
    parent_id: Optional[str]
    level: int
    sort_order: int

    is_active: bool
    created_at: datetime
    updated_at: datetime
    deactivated_at: Optional[datetime]


class CustomerGroupListResponse(BaseModel):
    """Paginated customer_group list response"""

    items: List[CustomerGroupResponse]
    skip: int
    limit: int
    total: int
    has_next: bool


class CustomerGroupTreeResponse(CustomerGroupResponse):
    """Schema for customer_group tree response with children"""
    children: List["CustomerGroupTreeResponse"] = Field(default_factory=list)
    children_count: int = 0
    has_children: bool = False


CustomerGroupTreeResponse.model_rebuild()

