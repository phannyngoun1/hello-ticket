"""
Service to sync predefined system roles to database

This ensures system roles are available in the database for each tenant.
"""
from typing import List, Dict
from app.domain.core.rbac.entity import Role
from app.domain.core.rbac.role_repository import IRoleRepository
from app.domain.shared.value_objects.system_roles import (
    get_all_system_roles,
    SystemRoleName,
    SYSTEM_ROLES
)
from app.shared.utils import generate_id


class RoleSyncService:
    """Service to sync system roles to database"""
    
    def __init__(self, role_repository: IRoleRepository):
        self.role_repository = role_repository
    
    async def sync_system_roles_for_tenant(self, tenant_id: str) -> List[Role]:
        """
        Sync all system roles to database for a tenant
        
        This should be called when:
        1. A new tenant is created
        2. System roles are updated in code
        
        Args:
            tenant_id: The tenant ID to sync roles for
            
        Returns:
            List of synced roles
        """
        synced_roles = []
        system_roles = get_all_system_roles()
        
        for system_role_def in system_roles:
            # Check if role already exists
            existing_role = await self.role_repository.get_by_name(
                system_role_def.name.value,
                tenant_id
            )
            
            if existing_role:
                # Update existing role with latest permissions
                existing_role.set_permissions(system_role_def.get_permission_strings())
                existing_role.description = system_role_def.description
                updated_role = await self.role_repository.update(existing_role)
                synced_roles.append(updated_role)
            else:
                # Create new system role
                new_role = Role(
                    id=generate_id(),
                    name=system_role_def.name.value,
                    description=system_role_def.description,
                    permissions=system_role_def.get_permission_strings(),
                    tenant_id=tenant_id,
                    is_system_role=True,
                    is_active=True,
                    created_by=None  # System created
                )
                created_role = await self.role_repository.create(new_role)
                synced_roles.append(created_role)
        
        return synced_roles
    
    async def sync_single_system_role(
        self,
        role_name: SystemRoleName,
        tenant_id: str
    ) -> Role:
        """
        Sync a single system role to database
        
        Args:
            role_name: System role name to sync
            tenant_id: The tenant ID
            
        Returns:
            Synced role
        """
        system_role_def = SYSTEM_ROLES[role_name]
        
        # Check if role already exists
        existing_role = await self.role_repository.get_by_name(
            system_role_def.name.value,
            tenant_id
        )
        
        if existing_role:
            # Update existing role
            existing_role.set_permissions(system_role_def.get_permission_strings())
            existing_role.description = system_role_def.description
            return await self.role_repository.update(existing_role)
        else:
            # Create new system role
            new_role = Role(
                id=generate_id(),
                name=system_role_def.name.value,
                description=system_role_def.description,
                permissions=system_role_def.get_permission_strings(),
                tenant_id=tenant_id,
                is_system_role=True,
                is_active=True,
                created_by=None
            )
            return await self.role_repository.create(new_role)
    
    async def ensure_system_roles_exist(self, tenant_id: str) -> bool:
        """
        Ensure all system roles exist for a tenant
        
        Returns True if all system roles exist, False otherwise
        """
        system_roles = get_all_system_roles()
        
        for system_role_def in system_roles:
            existing_role = await self.role_repository.get_by_name(
                system_role_def.name.value,
                tenant_id
            )
            if not existing_role:
                return False
        
        return True

