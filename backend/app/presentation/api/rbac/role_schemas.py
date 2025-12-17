"""
API schemas for custom role management
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# Custom Role Schemas

class CustomRoleCreate(BaseModel):
    """Schema for creating a new custom role"""
    name: str = Field(..., min_length=1, max_length=100, description="Role name")
    description: Optional[str] = Field(None, max_length=500, description="Role description")
    permissions: List[str] = Field(..., min_items=1, description="List of permissions")


class CustomRoleUpdate(BaseModel):
    """Schema for updating a custom role"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Role name")
    description: Optional[str] = Field(None, max_length=500, description="Role description")
    permissions: Optional[List[str]] = Field(None, min_items=1, description="List of permissions")


class RoleResponse(BaseModel):
    """Schema for role response"""
    id: str
    tenant_id: str
    name: str
    description: Optional[str]
    permissions: List[str]
    is_system_role: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RoleListResponse(BaseModel):
    """Schema for list of roles"""
    roles: List[RoleResponse]
    total: int


# User-Role Assignment Schemas

class AssignRoleToUserRequest(BaseModel):
    """Schema for assigning a role to a user"""
    user_id: str = Field(..., description="User ID")
    role_id: str = Field(..., description="Role ID")


class UserRoleResponse(BaseModel):
    """Schema for user-role assignment response"""
    user_id: str
    role_id: str
    tenant_id: str
    assigned_at: datetime

    class Config:
        from_attributes = True


class UserPermissionsResponse(BaseModel):
    """Schema for user's all permissions"""
    user_id: str
    tenant_id: str
    base_role: str
    direct_roles: List[RoleResponse]
    group_roles: List[RoleResponse]
    all_permissions: List[str]

    class Config:
        from_attributes = True

