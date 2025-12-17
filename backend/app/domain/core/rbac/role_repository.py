"""
Role repository interface
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.core.rbac.entity import Role
from app.domain.core.rbac.user_role_value_object import UserRole


class IRoleRepository(ABC):
    """Interface for role repository"""
    
    @abstractmethod
    async def create(self, role: Role) -> Role:
        """Create a new role"""
        pass
    
    @abstractmethod
    async def get_by_id(self, role_id: str, tenant_id: str) -> Optional[Role]:
        """Get role by ID"""
        pass
    
    @abstractmethod
    async def get_by_name(self, name: str, tenant_id: str) -> Optional[Role]:
        """Get role by name"""
        pass
    
    @abstractmethod
    async def list_by_tenant(self, tenant_id: str, include_inactive: bool = False) -> List[Role]:
        """List all roles for a tenant"""
        pass
    
    @abstractmethod
    async def update(self, role: Role) -> Role:
        """Update a role"""
        pass
    
    @abstractmethod
    async def delete(self, role_id: str, tenant_id: str) -> bool:
        """Delete a role"""
        pass
    
    # Direct role assignment (Method 1)
    
    @abstractmethod
    async def assign_role_to_user(self, user_role: UserRole) -> UserRole:
        """Directly assign a role to a user"""
        pass
    
    @abstractmethod
    async def remove_role_from_user(self, user_id: str, role_id: str, tenant_id: str) -> bool:
        """Remove a directly assigned role from a user"""
        pass
    
    @abstractmethod
    async def get_user_direct_roles(self, user_id: str, tenant_id: str) -> List[Role]:
        """Get all roles directly assigned to a user (not through groups)"""
        pass
    
    @abstractmethod
    async def is_role_assigned_to_user(self, user_id: str, role_id: str, tenant_id: str) -> bool:
        """Check if a role is directly assigned to a user"""
        pass
    
    @abstractmethod
    async def get_role_users(self, role_id: str, tenant_id: str) -> List[str]:
        """Get all user IDs who have this role assigned directly"""
        pass

