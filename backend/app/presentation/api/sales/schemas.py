"""Pydantic schemas for sales APIs"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class CustomerCreateRequest(BaseModel):
    """Payload for customer creation"""

    code: str = Field(..., description="Customer business code")
    name: str = Field(..., description="Display name for the customer")


class CustomerUpdateRequest(BaseModel):
    """Payload for customer updates"""

    code: Optional[str] = Field(None, description="Customer business code")
    name: Optional[str] = Field(None, description="Display name for the customer")


class CustomerResponse(BaseModel):
    """Customer response model"""

    id: str
    tenant_id: str
    code: str
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deactivated_at: Optional[datetime]


class CustomerListResponse(BaseModel):
    """Paginated customer list response"""

    items: List[CustomerResponse]
    skip: int
    limit: int
    total: int
    has_next: bool
