"""Pydantic schemas for Sales APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CustomerTypeCreateRequest(BaseModel):
    """Payload for customer_type creation"""

    code: str = Field(..., description="CustomerType business code")
    name: str = Field(..., description="Display name for the customer_type")


class CustomerTypeUpdateRequest(BaseModel):
    """Payload for customer_type updates"""

    code: Optional[str] = Field(None, description="CustomerType business code")
    name: Optional[str] = Field(None, description="Display name for the customer_type")


class CustomerTypeResponse(BaseModel):
    """CustomerType response model"""

    id: str
    tenant_id: str
    code: str
    name: str

    is_active: bool
    created_at: datetime
    updated_at: datetime


class CustomerTypeListResponse(BaseModel):
    """Paginated customer_type list response"""

    items: List[CustomerTypeResponse]
    skip: int
    limit: int
    total: int
    has_next: bool

