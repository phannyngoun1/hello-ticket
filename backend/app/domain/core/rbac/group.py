"""
Group entity for organizing users and roles

A Group is a collection of Roles.
Users in a group inherit all roles from that group.
"""
from datetime import datetime, timezone
from typing import Optional, List
from dataclasses import dataclass, field
from app.shared.utils import generate_id


@dataclass
class Group:
    """
    Group entity for organizing users with shared roles
    
    A Group contains:
    - Multiple Users (who are members)
    - Multiple Roles (that members inherit)
    
    Use Cases:
    - Department groups (Engineering, Sales, HR)
    - Project teams (Project Alpha, Beta Testing)
    - Organizational units with common role requirements
    
    Example:
        Engineering Group contains:
        - Role: "Backend Developer" (with permissions: code:read, code:write, staging:deploy)
        - Role: "Database Admin" (with permissions: database:read, database:write)
        
        All users in Engineering group get both roles and their permissions.
    """
    # Required fields
    name: str
    tenant_id: str
    
    # Optional fields with defaults
    id: str = field(default_factory=generate_id)
    description: Optional[str] = field(default=None)
    is_active: bool = field(default=True)
    created_by: Optional[str] = field(default=None)  # user_id who created the group
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    def __post_init__(self):
        """Validate group after initialization"""
        if not self.name or not self.name.strip():
            raise ValueError("Group name cannot be empty")
        if len(self.name) > 100:
            raise ValueError("Group name cannot exceed 100 characters")
        if not self.tenant_id:
            raise ValueError("Group must belong to a tenant")
    
    def update_name(self, new_name: str) -> None:
        """Update group name"""
        if not new_name or not new_name.strip():
            raise ValueError("Group name cannot be empty")
        if len(new_name) > 100:
            raise ValueError("Group name cannot exceed 100 characters")
        self.name = new_name
        self.updated_at = datetime.now(timezone.utc)
    
    def update_description(self, new_description: Optional[str]) -> None:
        """Update group description"""
        if new_description and len(new_description) > 500:
            raise ValueError("Group description cannot exceed 500 characters")
        self.description = new_description
        self.updated_at = datetime.now(timezone.utc)
    
    def deactivate(self) -> None:
        """Deactivate group"""
        self.is_active = False
        self.updated_at = datetime.now(timezone.utc)
    
    def activate(self) -> None:
        """Activate group"""
        self.is_active = True
        self.updated_at = datetime.now(timezone.utc)
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Group):
            return False
        return self.id == other.id
    
    def __hash__(self) -> int:
        return hash(self.id)


@dataclass
class UserGroup:
    """
    Many-to-many relationship between users and groups
    
    When a user is added to a group, they inherit all roles from that group.
    
    A user can belong to multiple groups.
    A group can have multiple users.
    """
    # Required fields
    user_id: str
    group_id: str
    tenant_id: str
    
    # Optional fields with defaults
    id: str = field(default_factory=generate_id)
    added_by: Optional[str] = field(default=None)  # user_id who added the user to the group
    added_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    def __post_init__(self):
        """Validate user group after initialization"""
        if not self.user_id:
            raise ValueError("user_id cannot be empty")
        if not self.group_id:
            raise ValueError("group_id cannot be empty")
        if not self.tenant_id:
            raise ValueError("tenant_id cannot be empty")
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, UserGroup):
            return False
        return self.user_id == other.user_id and self.group_id == other.group_id
    
    def __hash__(self) -> int:
        return hash((self.user_id, self.group_id))


@dataclass
class GroupRole:
    """
    Many-to-many relationship between groups and roles
    
    Defines which roles are included in a group.
    All users in the group inherit these roles.
    
    A group can have multiple roles.
    A role can be in multiple groups.
    """
    # Required fields
    group_id: str
    role_id: str
    tenant_id: str
    
    # Optional fields with defaults
    id: str = field(default_factory=generate_id)
    added_by: Optional[str] = field(default=None)  # user_id who added the role to the group
    added_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    def __post_init__(self):
        """Validate group role after initialization"""
        if not self.group_id:
            raise ValueError("group_id cannot be empty")
        if not self.role_id:
            raise ValueError("role_id cannot be empty")
        if not self.tenant_id:
            raise ValueError("tenant_id cannot be empty")
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, GroupRole):
            return False
        return self.group_id == other.group_id and self.role_id == other.role_id
    
    def __hash__(self) -> int:
        return hash((self.group_id, self.role_id))
