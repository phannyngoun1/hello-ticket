"""Pydantic schemas for Sales APIs"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class EmployeeCreateRequest(BaseModel):
    """Payload for employee creation"""

    code: Optional[str] = Field(None, description="Employee business code (auto-generated)")
    name: str = Field(..., description="Display name for the employee")


class EmployeeUpdateRequest(BaseModel):
    """Payload for employee updates"""

    code: Optional[str] = Field(None, description="Employee business code")
    name: Optional[str] = Field(None, description="Display name for the employee")


class EmployeeResponse(BaseModel):
    """Employee response model"""

    id: str
    tenant_id: str
    code: str
    name: str

    is_active: bool
    created_at: datetime
    updated_at: datetime
    deactivated_at: Optional[datetime]


class EmployeeListResponse(BaseModel):
    """Paginated employee list response"""

    items: List[EmployeeResponse]
    skip: int
    limit: int
    total: int
    has_next: bool

