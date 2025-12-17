"""
Custom Role Management Service - Business logic for managing tenant-specific custom roles
"""
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from app.domain.core.rbac.entity import Role
from app.domain.shared.value_objects.user_role import UserRole
from app.domain.core.rbac.role_repository import IRoleRepository
from app.shared.exceptions import (
    ConflictError,
    NotFoundError,
    ValidationError
)


class CustomRoleManagementService:
    """Service for managing custom (tenant-specific) roles"""
    
    def __init__(self, role_repository: IRoleRepository):
        self.role_repository = role_repository
    
    async def create_custom_role(
        self,
        tenant_id: str,
        name: str,
        permissions: List[str],
        description: Optional[str] = None
    ) -> Role:
        """
        Create a new custom role
        
        Args:
            tenant_id: Tenant ID
            name: Role name (must be unique within tenant)
            permissions: List of permission strings
            description: Optional role description
            
        Returns:
            Created role
            
        Raises:
            ConflictError: If role with same name already exists
            ValidationError: If validation fails
        """
        # Validate name
        if not name or len(name.strip()) == 0:
            raise ValidationError("Role name cannot be empty")
        
        if len(name) > 100:
            raise ValidationError("Role name cannot exceed 100 characters")
        
        # Validate permissions
        if not permissions or len(permissions) == 0:
            raise ValidationError("Role must have at least one permission")
        
        # Check if role with same name already exists
        existing = await self.role_repository.get_by_name(name, tenant_id)
        if existing:
            raise ConflictError(f"Role with name '{name}' already exists")
        
        # Validate and clean permission strings
        cleaned_permissions = [
            perm.strip()
            for perm in permissions
            if perm and perm.strip()
        ]
        
        if not cleaned_permissions:
            raise ValidationError("Role must have at least one valid permission")
        
        # Create role entity
        role = Role(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            name=name.strip(),
            permissions=cleaned_permissions,
            description=description.strip() if description else None,
            is_system_role=False,  # Custom roles are never system roles
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Save to database
        return await self.role_repository.create(role)
    
    async def get_role(self, role_id: str, tenant_id: str) -> Role:
        """
        Get role by ID
        
        Raises:
            NotFoundError: If role not found
        """
        role = await self.role_repository.get_by_id(role_id, tenant_id)
        if not role:
            raise NotFoundError(f"Role {role_id} not found")
        return role
    
    async def get_role_by_name(self, name: str, tenant_id: str) -> Optional[Role]:
        """Get role by name"""
        return await self.role_repository.get_by_name(name, tenant_id)
    
    async def list_roles(
        self,
        tenant_id: str,
        include_system_roles: bool = True
    ) -> List[Role]:
        """
        List all roles for a tenant
        
        Args:
            tenant_id: Tenant ID
            include_system_roles: If True, includes system roles; if False, only custom roles
        """
        return await self.role_repository.list_by_tenant(tenant_id, include_system_roles)
    
    async def update_custom_role(
        self,
        role_id: str,
        tenant_id: str,
        name: Optional[str] = None,
        permissions: Optional[List[str]] = None,
        description: Optional[str] = None
    ) -> Role:
        """
        Update a custom role
        
        Note: System roles cannot be updated through this method
        
        Raises:
            NotFoundError: If role not found
            ConflictError: If new name conflicts with existing role
            ValidationError: If validation fails or trying to update system role
        """
        # Get existing role
        role = await self.get_role(role_id, tenant_id)
        
        # Prevent updating system roles
        if role.is_system_role:
            raise ValidationError("Cannot update system roles. System roles are managed by the platform.")
        
        # Update name if provided
        if name is not None:
            if not name or len(name.strip()) == 0:
                raise ValidationError("Role name cannot be empty")
            
            if len(name) > 100:
                raise ValidationError("Role name cannot exceed 100 characters")
            
            # Check if new name conflicts with another role
            if name.strip() != role.name:
                existing = await self.role_repository.get_by_name(name.strip(), tenant_id)
                if existing and existing.id != role_id:
                    raise ConflictError(f"Role with name '{name}' already exists")
            
            role.name = name.strip()
        
        # Update permissions if provided
        if permissions is not None:
            if not permissions or len(permissions) == 0:
                raise ValidationError("Role must have at least one permission")
            
            cleaned_permissions = [
                perm.strip()
                for perm in permissions
                if perm and perm.strip()
            ]
            
            if not cleaned_permissions:
                raise ValidationError("Role must have at least one valid permission")
            
            role.permissions = cleaned_permissions
        
        # Update description if provided
        if description is not None:
            role.description = description.strip() if description else None
        
        # Update timestamp
        role.updated_at = datetime.now(timezone.utc)
        
        # Save to database
        return await self.role_repository.update(role)
    
    async def delete_custom_role(self, role_id: str, tenant_id: str) -> bool:
        """
        Delete a custom role
        
        Note: System roles cannot be deleted
        
        Raises:
            ValidationError: If trying to delete a system role
        """
        # Get role to check if it's a system role
        role = await self.get_role(role_id, tenant_id)
        
        # Prevent deleting system roles
        if role.is_system_role:
            raise ValidationError("Cannot delete system roles. System roles are managed by the platform.")
        
        return await self.role_repository.delete(role_id, tenant_id)
    
    # User-Role assignment operations (Direct assignment - Method 1)
    
    async def assign_role_to_user(
        self,
        user_id: str,
        role_id: str,
        tenant_id: str,
        assigned_by: Optional[str] = None
    ) -> UserRole:
        """
        Assign a role directly to a user (Method 1)
        
        Args:
            user_id: ID of user to assign role to
            role_id: ID of role to assign
            tenant_id: Tenant ID
            assigned_by: ID of user performing the assignment (optional)
        
        Raises:
            NotFoundError: If role not found
        """
        # Verify role exists
        role = await self.get_role(role_id, tenant_id)
        
        # Create user-role relationship
        user_role = UserRole(
            user_id=user_id,
            role_id=role_id,
            tenant_id=tenant_id,
            assigned_at=datetime.now(timezone.utc)
        )
        
        return await self.role_repository.assign_role_to_user(user_role, assigned_by=assigned_by)
    
    async def remove_role_from_user(
        self,
        user_id: str,
        role_id: str,
        tenant_id: str
    ) -> bool:
        """Remove a role from a user (direct assignment only)"""
        return await self.role_repository.remove_role_from_user(
            user_id,
            role_id,
            tenant_id
        )
    
    async def get_user_direct_roles(self, user_id: str, tenant_id: str) -> List[Role]:
        """
        Get roles directly assigned to a user (Method 1 only)
        
        This does NOT include roles inherited from groups
        """
        return await self.role_repository.get_user_roles(user_id, tenant_id)
    
    async def has_permission(
        self,
        user_id: str,
        tenant_id: str,
        permission: str
    ) -> bool:
        """
        Check if a user has a specific permission (from direct role assignments only)
        
        For full permission check including groups, use GroupManagementService.get_user_all_roles()
        """
        roles = await self.get_user_direct_roles(user_id, tenant_id)
        
        for role in roles:
            if permission in role.permissions:
                return True
        
        return False

