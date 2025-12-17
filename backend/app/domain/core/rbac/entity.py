"""
Role entity for permission management

A Role is a named collection of permissions.
Roles can be assigned to users in two ways:
1. Direct assignment (user → role)
2. Group membership (user → group → role)
"""
from datetime import datetime, timezone
from typing import Optional, List, Set
from dataclasses import dataclass, field
from app.shared.utils import generate_id


@dataclass
class Role:
    """
    Role entity representing a collection of permissions
    
    Roles define what actions can be performed in the system.
    
    Examples:
    - "Backend Developer" role with permissions: code:read, code:write, staging:deploy
    - "Content Editor" role with permissions: product:read, product:update
    - "Manager" role with permissions: all:read, team:manage
    
    Roles can be assigned to users:
    1. Directly: User → Role
    2. Via Groups: User → Group → Role
    """
    # Required fields
    name: str
    tenant_id: str
    permissions: List[str] = field(default_factory=list)
    
    # Optional fields with defaults
    id: str = field(default_factory=generate_id)
    description: Optional[str] = field(default=None)
    is_active: bool = field(default=True)
    is_system_role: bool = field(default=False)  # System roles cannot be deleted
    created_by: Optional[str] = field(default=None)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    def __post_init__(self):
        """Validate role after initialization"""
        if not self.name or not self.name.strip():
            raise ValueError("Role name cannot be empty")
        if len(self.name) > 100:
            raise ValueError("Role name cannot exceed 100 characters")
        if not self.tenant_id:
            raise ValueError("Role must belong to a tenant")
        # Ensure permissions is a list
        if not isinstance(self.permissions, list):
            raise ValueError("Permissions must be a list")
    
    def update_name(self, new_name: str) -> None:
        """Update role name"""
        if not new_name or not new_name.strip():
            raise ValueError("Role name cannot be empty")
        if len(new_name) > 100:
            raise ValueError("Role name cannot exceed 100 characters")
        self.name = new_name
        self.updated_at = datetime.now(timezone.utc)
    
    def update_description(self, new_description: Optional[str]) -> None:
        """Update role description"""
        if new_description and len(new_description) > 500:
            raise ValueError("Role description cannot exceed 500 characters")
        self.description = new_description
        self.updated_at = datetime.now(timezone.utc)
    
    def add_permission(self, permission: str) -> None:
        """Add a permission to the role"""
        if not permission:
            raise ValueError("Permission cannot be empty")
        if permission not in self.permissions:
            self.permissions.append(permission)
            self.updated_at = datetime.now(timezone.utc)
    
    def remove_permission(self, permission: str) -> None:
        """Remove a permission from the role"""
        if permission in self.permissions:
            self.permissions.remove(permission)
            self.updated_at = datetime.now(timezone.utc)
    
    def set_permissions(self, permissions: List[str]) -> None:
        """Set all permissions for the role"""
        if not isinstance(permissions, list):
            raise ValueError("Permissions must be a list")
        self.permissions = permissions
        self.updated_at = datetime.now(timezone.utc)
    
    def has_permission(self, permission: str) -> bool:
        """Check if role has a specific permission"""
        return permission in self.permissions
    
    def get_permissions(self) -> Set[str]:
        """Get all permissions as a set"""
        return set(self.permissions)
    
    def deactivate(self) -> None:
        """Deactivate role"""
        if self.is_system_role:
            raise ValueError("Cannot deactivate system roles")
        self.is_active = False
        self.updated_at = datetime.now(timezone.utc)
    
    def activate(self) -> None:
        """Activate role"""
        self.is_active = True
        self.updated_at = datetime.now(timezone.utc)
    
    def can_be_deleted(self) -> bool:
        """Check if role can be deleted"""
        return not self.is_system_role
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Role):
            return False
        return self.id == other.id
    
    def __hash__(self) -> int:
        return hash(self.id)


@dataclass
class UserRole:
    """
    Direct assignment of a role to a user
    
    This is one of two ways to assign roles:
    1. Direct: User → Role (this class)
    2. Via Group: User → Group → Role
    
    A user can have multiple roles assigned directly.
    A role can be assigned to multiple users directly.
    """
    # Required fields
    user_id: str
    role_id: str
    tenant_id: str
    
    # Optional fields with defaults
    id: str = field(default_factory=generate_id)
    assigned_by: Optional[str] = field(default=None)  # user_id who assigned the role
    assigned_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    def __post_init__(self):
        """Validate user role after initialization"""
        if not self.user_id:
            raise ValueError("user_id cannot be empty")
        if not self.role_id:
            raise ValueError("role_id cannot be empty")
        if not self.tenant_id:
            raise ValueError("tenant_id cannot be empty")
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, UserRole):
            return False
        return self.user_id == other.user_id and self.role_id == other.role_id
    
    def __hash__(self) -> int:
        return hash((self.user_id, self.role_id))

