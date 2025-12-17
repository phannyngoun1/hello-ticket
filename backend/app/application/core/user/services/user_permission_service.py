"""
User Permission Service - Loads all permissions for a user from all sources
"""
from typing import List, Set
from app.domain.core.rbac.role_repository import IRoleRepository
from app.domain.core.rbac.group_repository import IGroupRepository


class UserPermissionService:
    """Service for loading user permissions from all sources"""
    
    def __init__(
        self,
        role_repository: IRoleRepository,
        group_repository: IGroupRepository
    ):
        self.role_repository = role_repository
        self.group_repository = group_repository
    
    async def get_all_permission_strings(self, user_id: str, tenant_id: str) -> List[str]:
        """
        Get all permission strings for a user from:
        1. Direct role assignments (Method 1)
        2. Group memberships (Method 2)
        
        Returns deduplicated list of permission strings
        """
        all_permissions: Set[str] = set()
        
        # Get permissions from direct role assignments (Method 1)
        direct_roles = await self.role_repository.get_user_roles(user_id, tenant_id)
        for role in direct_roles:
            for permission in role.permissions:
                all_permissions.add(permission.name)
        
        # Get permissions from group memberships (Method 2)
        group_roles = await self.group_repository.get_user_roles_from_groups(user_id, tenant_id)
        for role in group_roles:
            for permission in role.permissions:
                all_permissions.add(permission.name)
        
        return list(all_permissions)
    
    async def load_user_permissions(self, user_id: str, tenant_id: str) -> tuple[List[str], List[str]]:
        """
        Load user permissions separately by source
        
        Returns:
            tuple: (group_permissions, custom_role_permissions)
        """
        group_permissions: Set[str] = set()
        custom_role_permissions: Set[str] = set()
        
        # Get permissions from direct role assignments (Method 1)
        direct_roles = await self.role_repository.get_user_roles(user_id, tenant_id)
        for role in direct_roles:
            for permission in role.permissions:
                custom_role_permissions.add(permission.name)
        
        # Get permissions from group memberships (Method 2)
        group_roles = await self.group_repository.get_user_roles_from_groups(user_id, tenant_id)
        for role in group_roles:
            for permission in role.permissions:
                group_permissions.add(permission.name)
        
        return (list(group_permissions), list(custom_role_permissions))

