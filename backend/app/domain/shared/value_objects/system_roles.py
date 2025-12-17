"""
System-level predefined roles with their permissions

These are the base roles that exist in every tenant.
They are defined in code and optionally synced to the database.
"""
from enum import Enum
from typing import Dict, List, Set
from dataclasses import dataclass


class SystemRoleName(str, Enum):
    """Predefined system roles available to all tenants"""
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"
    GUEST = "guest"


class SystemPermission(str, Enum):
    """System-level permissions"""
    # User management
    CREATE_USER = "user:create"
    READ_USER = "user:read"
    UPDATE_USER = "user:update"
    DELETE_USER = "user:delete"
    
    # Role management
    CREATE_ROLE = "role:create"
    READ_ROLE = "role:read"
    UPDATE_ROLE = "role:update"
    DELETE_ROLE = "role:delete"
    ASSIGN_ROLE = "role:assign"
    
    # Group management
    CREATE_GROUP = "group:create"
    READ_GROUP = "group:read"
    UPDATE_GROUP = "group:update"
    DELETE_GROUP = "group:delete"
    MANAGE_GROUP_MEMBERS = "group_members:manage"
    MANAGE_GROUP_ROLES = "group_roles:manage"
    
    # Integration permissions
    MANAGE_INTEGRATIONS = "integrations:manage"
    VIEW_INTEGRATIONS = "integrations:view"
    
    # Workflow permissions
    MANAGE_WORKFLOWS = "workflows:manage"
    VIEW_WORKFLOWS = "workflows:view"
    
    # Audit permissions
    VIEW_AUDIT_LOGS = "audit_logs:view"


# Predefined system roles with their permissions
SYSTEM_ROLE_PERMISSIONS: Dict[SystemRoleName, Set[SystemPermission]] = {
    SystemRoleName.ADMIN: {
        # Admin has all permissions
        SystemPermission.CREATE_USER,
        SystemPermission.READ_USER,
        SystemPermission.UPDATE_USER,
        SystemPermission.DELETE_USER,
        SystemPermission.CREATE_ROLE,
        SystemPermission.READ_ROLE,
        SystemPermission.UPDATE_ROLE,
        SystemPermission.DELETE_ROLE,
        SystemPermission.ASSIGN_ROLE,
        SystemPermission.CREATE_GROUP,
        SystemPermission.READ_GROUP,
        SystemPermission.UPDATE_GROUP,
        SystemPermission.DELETE_GROUP,
        SystemPermission.MANAGE_GROUP_MEMBERS,
        SystemPermission.MANAGE_GROUP_ROLES,
        SystemPermission.MANAGE_INTEGRATIONS,
        SystemPermission.VIEW_INTEGRATIONS,
        SystemPermission.MANAGE_WORKFLOWS,
        SystemPermission.VIEW_WORKFLOWS,
        SystemPermission.VIEW_AUDIT_LOGS,
    },
    SystemRoleName.MANAGER: {
        # Manager can manage most resources
        SystemPermission.CREATE_USER,
        SystemPermission.READ_USER,
        SystemPermission.UPDATE_USER,
        SystemPermission.READ_ROLE,
        SystemPermission.READ_GROUP,
        SystemPermission.VIEW_INTEGRATIONS,
        SystemPermission.VIEW_WORKFLOWS,
        SystemPermission.VIEW_AUDIT_LOGS,
    },
    SystemRoleName.USER: {
        # Regular user can read some resources
        SystemPermission.READ_USER,
    },
    SystemRoleName.GUEST: {
        # Guest has no special permissions
    }
}


@dataclass(frozen=True)
class SystemRoleDefinition:
    """Definition of a system role"""
    name: SystemRoleName
    display_name: str
    description: str
    permissions: Set[SystemPermission]
    is_system_role: bool = True
    
    def to_dict(self) -> dict:
        """Convert to dictionary for database sync"""
        return {
            "name": self.name.value,
            "description": self.description,
            "permissions": [p.value for p in self.permissions],
            "is_system_role": True,
            "is_active": True,
        }
    
    def get_permission_strings(self) -> List[str]:
        """Get permissions as list of strings"""
        return [p.value for p in self.permissions]


# Define all system roles
SYSTEM_ROLES: Dict[SystemRoleName, SystemRoleDefinition] = {
    SystemRoleName.ADMIN: SystemRoleDefinition(
        name=SystemRoleName.ADMIN,
        display_name="Administrator",
        description="Full access to all tenant resources and settings",
        permissions=SYSTEM_ROLE_PERMISSIONS[SystemRoleName.ADMIN]
    ),
    SystemRoleName.MANAGER: SystemRoleDefinition(
        name=SystemRoleName.MANAGER,
        display_name="Manager",
        description="Can manage most resources but not system settings",
        permissions=SYSTEM_ROLE_PERMISSIONS[SystemRoleName.MANAGER]
    ),
    SystemRoleName.USER: SystemRoleDefinition(
        name=SystemRoleName.USER,
        display_name="User",
        description="Standard user with basic permissions",
        permissions=SYSTEM_ROLE_PERMISSIONS[SystemRoleName.USER]
    ),
    SystemRoleName.GUEST: SystemRoleDefinition(
        name=SystemRoleName.GUEST,
        display_name="Guest",
        description="Limited read-only access",
        permissions=SYSTEM_ROLE_PERMISSIONS[SystemRoleName.GUEST]
    ),
}


def get_system_role(role_name: str) -> SystemRoleDefinition:
    """Get a system role by name"""
    try:
        role_enum = SystemRoleName(role_name)
        return SYSTEM_ROLES[role_enum]
    except (ValueError, KeyError):
        raise ValueError(f"Unknown system role: {role_name}")


def get_all_system_roles() -> List[SystemRoleDefinition]:
    """Get all system roles"""
    return list(SYSTEM_ROLES.values())


def is_system_role(role_name: str) -> bool:
    """Check if a role name is a system role"""
    try:
        SystemRoleName(role_name)
        return True
    except ValueError:
        return False


def get_system_role_permissions(role_name: str) -> Set[str]:
    """Get permissions for a system role as strings"""
    role = get_system_role(role_name)
    return {p.value for p in role.permissions}

