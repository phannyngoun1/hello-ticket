"""
API schemas for group management
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# Group Schemas

class GroupCreate(BaseModel):
    """Schema for creating a new group"""
    name: str = Field(..., min_length=1, max_length=100, description="Group name")
    description: Optional[str] = Field(None, max_length=500, description="Group description")


class GroupUpdate(BaseModel):
    """Schema for updating a group"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Group name")
    description: Optional[str] = Field(None, max_length=500, description="Group description")
    is_active: Optional[bool] = Field(None, description="Group active status")


class GroupResponse(BaseModel):
    """Schema for group response"""
    id: str
    tenant_id: str
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    members_count: Optional[int] = Field(default=0, description="Number of members in the group")
    roles_count: Optional[int] = Field(default=0, description="Number of roles assigned to the group")

    class Config:
        from_attributes = True


class GroupListResponse(BaseModel):
    """Schema for list of groups"""
    groups: List[GroupResponse]
    total: int


# User-Group Membership Schemas

class AddUserToGroupRequest(BaseModel):
    """Schema for adding a user to a group"""
    user_id: str = Field(..., description="User ID to add to the group")


class UserGroupResponse(BaseModel):
    """Schema for user-group membership response"""
    user_id: str
    group_id: str
    tenant_id: str
    assigned_at: datetime

    class Config:
        from_attributes = True


# Group-Role Assignment Schemas

class AddRoleToGroupRequest(BaseModel):
    """Schema for adding a role to a group"""
    role_id: str = Field(..., description="Role ID to add to the group")


class GroupRoleResponse(BaseModel):
    """Schema for group-role assignment response"""
    group_id: str
    role_id: str
    tenant_id: str
    assigned_at: datetime

    class Config:
        from_attributes = True


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

