"""
Group Management Service - Business logic for managing groups
"""
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from app.domain.core.rbac.group import Group, UserGroup, GroupRole
from app.domain.core.rbac.entity import Role
from app.domain.core.rbac.group_repository import IGroupRepository
from app.domain.core.rbac.role_repository import IRoleRepository
from app.shared.exceptions import (
    ConflictError,
    NotFoundError,
    ValidationError
)


class GroupManagementService:
    """Service for managing groups and their relationships"""
    
    def __init__(
        self,
        group_repository: IGroupRepository,
        role_repository: IRoleRepository
    ):
        self.group_repository = group_repository
        self.role_repository = role_repository
    
    # Group CRUD operations
    
    async def create_group(
        self,
        tenant_id: str,
        name: str,
        description: Optional[str] = None
    ) -> Group:
        """
        Create a new group
        
        Args:
            tenant_id: Tenant ID
            name: Group name (must be unique within tenant)
            description: Optional group description
            
        Returns:
            Created group
            
        Raises:
            ConflictError: If group with same name already exists
            ValidationError: If validation fails
        """
        # Validate name
        if not name or len(name.strip()) == 0:
            raise ValidationError("Group name cannot be empty")
        
        if len(name) > 100:
            raise ValidationError("Group name cannot exceed 100 characters")
        
        # Check if group with same name already exists
        existing = await self.group_repository.get_by_name(name, tenant_id)
        if existing:
            raise ConflictError(f"Group with name '{name}' already exists")
        
        # Create group entity
        group = Group(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            name=name.strip(),
            description=description.strip() if description else None,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Save to database
        return await self.group_repository.create(group)
    
    async def get_group(self, group_id: str, tenant_id: str) -> Group:
        """
        Get group by ID
        
        Raises:
            NotFoundError: If group not found
        """
        group = await self.group_repository.get_by_id(group_id, tenant_id)
        if not group:
            raise NotFoundError(f"Group {group_id} not found")
        return group
    
    async def list_groups(
        self,
        tenant_id: str,
        include_inactive: bool = False
    ) -> List[Group]:
        """List all groups for a tenant"""
        return await self.group_repository.list_by_tenant(tenant_id, include_inactive)
    
    async def update_group(
        self,
        group_id: str,
        tenant_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Group:
        """
        Update a group
        
        Raises:
            NotFoundError: If group not found
            ConflictError: If new name conflicts with existing group
            ValidationError: If validation fails
        """
        # Get existing group
        group = await self.get_group(group_id, tenant_id)
        
        # Update name if provided
        if name is not None:
            if not name or len(name.strip()) == 0:
                raise ValidationError("Group name cannot be empty")
            
            if len(name) > 100:
                raise ValidationError("Group name cannot exceed 100 characters")
            
            # Check if new name conflicts with another group
            if name.strip() != group.name:
                existing = await self.group_repository.get_by_name(name.strip(), tenant_id)
                if existing and existing.id != group_id:
                    raise ConflictError(f"Group with name '{name}' already exists")
            
            group.name = name.strip()
        
        # Update description if provided
        if description is not None:
            group.description = description.strip() if description else None
        
        # Update active status if provided
        if is_active is not None:
            group.is_active = is_active
        
        # Update timestamp
        group.updated_at = datetime.now(timezone.utc)
        
        # Save to database
        return await self.group_repository.update(group)
    
    async def delete_group(self, group_id: str, tenant_id: str) -> bool:
        """
        Delete a group
        
        Returns:
            True if deleted, False if not found
        """
        return await self.group_repository.delete(group_id, tenant_id)
    
    # User-Group membership operations
    
    async def add_user_to_group(
        self,
        user_id: str,
        group_id: str,
        tenant_id: str
    ) -> UserGroup:
        """
        Add a user to a group
        
        The user will inherit all roles from this group
        
        Raises:
            NotFoundError: If group not found
        """
        # Verify group exists
        await self.get_group(group_id, tenant_id)
        
        # Create user-group relationship
        user_group = UserGroup(
            user_id=user_id,
            group_id=group_id,
            tenant_id=tenant_id,
            added_at=datetime.now(timezone.utc)
        )
        
        return await self.group_repository.add_user_to_group(user_group)
    
    async def remove_user_from_group(
        self,
        user_id: str,
        group_id: str,
        tenant_id: str
    ) -> bool:
        """Remove a user from a group"""
        return await self.group_repository.remove_user_from_group(
            user_id,
            group_id,
            tenant_id
        )
    
    async def get_user_groups(self, user_id: str, tenant_id: str) -> List[Group]:
        """Get all groups a user belongs to"""
        return await self.group_repository.get_user_groups(user_id, tenant_id)
    
    async def get_group_members(self, group_id: str, tenant_id: str) -> List[str]:
        """Get all user IDs that are members of a group"""
        return await self.group_repository.get_group_users(group_id, tenant_id)
    
    # Group-Role operations
    
    async def add_role_to_group(
        self,
        group_id: str,
        role_id: str,
        tenant_id: str
    ) -> GroupRole:
        """
        Add a role to a group
        
        All users in this group will inherit this role
        
        Raises:
            NotFoundError: If group or role not found
        """
        # Verify group exists
        await self.get_group(group_id, tenant_id)
        
        # Verify role exists
        role = await self.role_repository.get_by_id(role_id, tenant_id)
        if not role:
            raise NotFoundError(f"Role {role_id} not found")
        
        # Create group-role relationship
        group_role = GroupRole(
            group_id=group_id,
            role_id=role_id,
            tenant_id=tenant_id,
            added_at=datetime.now(timezone.utc)
        )
        
        return await self.group_repository.add_role_to_group(group_role)
    
    async def remove_role_from_group(
        self,
        group_id: str,
        role_id: str,
        tenant_id: str
    ) -> bool:
        """Remove a role from a group"""
        return await self.group_repository.remove_role_from_group(
            group_id,
            role_id,
            tenant_id
        )
    
    async def get_group_roles(self, group_id: str, tenant_id: str) -> List[Role]:
        """Get all roles that belong to a group"""
        return await self.group_repository.get_group_roles(group_id, tenant_id)
    
    # User role calculation
    
    async def get_user_all_roles(self, user_id: str, tenant_id: str) -> List[Role]:
        """
        Get all roles for a user from both:
        1. Direct role assignments (user_roles table)
        2. Group memberships (user_groups + group_roles tables)
        
        Returns deduplicated list of roles
        """
        # Get roles from direct assignments (Method 1)
        direct_roles = await self.role_repository.get_user_roles(user_id, tenant_id)
        
        # Get roles from group memberships (Method 2)
        group_roles = await self.group_repository.get_user_roles_from_groups(
            user_id,
            tenant_id
        )
        
        # Combine and deduplicate by role ID
        all_roles_dict = {role.id: role for role in direct_roles}
        for role in group_roles:
            all_roles_dict[role.id] = role
        
        return list(all_roles_dict.values())
    
    async def get_groups_member_counts(self, group_ids: List[str], tenant_id: str) -> dict[str, int]:
        """
        Get member counts for multiple groups in a single query
        
        Returns a dict mapping group_id to member count
        """
        # Check if repository has the batch method (it's an implementation detail)
        if hasattr(self.group_repository, 'get_groups_member_counts'):
            return await self.group_repository.get_groups_member_counts(group_ids, tenant_id)
        
        # Fallback: fetch individually (less efficient)
        counts = {}
        for group_id in group_ids:
            members = await self.get_group_members(group_id, tenant_id)
            counts[group_id] = len(members)
        return counts
    
    async def get_groups_role_counts(self, group_ids: List[str], tenant_id: str) -> dict[str, int]:
        """
        Get role counts for multiple groups in a single query
        
        Returns a dict mapping group_id to role count
        """
        # Check if repository has the batch method (it's an implementation detail)
        if hasattr(self.group_repository, 'get_groups_role_counts'):
            return await self.group_repository.get_groups_role_counts(group_ids, tenant_id)
        
        # Fallback: fetch individually (less efficient)
        counts = {}
        for group_id in group_ids:
            roles = await self.get_group_roles(group_id, tenant_id)
            counts[group_id] = len(roles)
        return counts

