"""
Group repository interface
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.core.rbac.group import Group, UserGroup, GroupRole
from app.domain.core.rbac.entity import Role


class IGroupRepository(ABC):
    """Interface for group repository"""
    
    # Group CRUD operations
    
    @abstractmethod
    async def create(self, group: Group) -> Group:
        """Create a new group"""
        pass
    
    @abstractmethod
    async def get_by_id(self, group_id: str, tenant_id: str) -> Optional[Group]:
        """Get group by ID"""
        pass
    
    @abstractmethod
    async def get_by_name(self, name: str, tenant_id: str) -> Optional[Group]:
        """Get group by name"""
        pass
    
    @abstractmethod
    async def list_by_tenant(self, tenant_id: str, include_inactive: bool = False) -> List[Group]:
        """List all groups for a tenant"""
        pass
    
    @abstractmethod
    async def update(self, group: Group) -> Group:
        """Update a group"""
        pass
    
    @abstractmethod
    async def delete(self, group_id: str, tenant_id: str) -> bool:
        """Delete a group"""
        pass
    
    # User-Group relationship (user membership in groups)
    
    @abstractmethod
    async def add_user_to_group(self, user_group: UserGroup) -> UserGroup:
        """Add a user to a group (user becomes member)"""
        pass
    
    @abstractmethod
    async def remove_user_from_group(self, user_id: str, group_id: str, tenant_id: str) -> bool:
        """Remove a user from a group"""
        pass
    
    @abstractmethod
    async def get_user_groups(self, user_id: str, tenant_id: str) -> List[Group]:
        """Get all groups a user belongs to"""
        pass
    
    @abstractmethod
    async def get_group_users(self, group_id: str, tenant_id: str) -> List[str]:
        """Get all user IDs in a group"""
        pass
    
    @abstractmethod
    async def is_user_in_group(self, user_id: str, group_id: str, tenant_id: str) -> bool:
        """Check if a user is in a group"""
        pass
    
    # Group-Role relationship (roles that belong to the group)
    
    @abstractmethod
    async def add_role_to_group(self, group_role: GroupRole) -> GroupRole:
        """Add a role to a group (all group members inherit this role)"""
        pass
    
    @abstractmethod
    async def remove_role_from_group(self, group_id: str, role_id: str, tenant_id: str) -> bool:
        """Remove a role from a group"""
        pass
    
    @abstractmethod
    async def get_group_roles(self, group_id: str, tenant_id: str) -> List[Role]:
        """Get all roles that belong to a group"""
        pass
    
    @abstractmethod
    async def is_role_in_group(self, group_id: str, role_id: str, tenant_id: str) -> bool:
        """Check if a role belongs to a group"""
        pass
    
    @abstractmethod
    async def get_user_roles_from_groups(self, user_id: str, tenant_id: str) -> List[Role]:
        """
        Get all roles a user has through their group memberships (Method 2)
        
        This combines:
        1. Get all groups the user belongs to
        2. Get all roles from those groups
        3. Return deduplicated list of roles
        """
        pass

