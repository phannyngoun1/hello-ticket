"""
SQLModel implementation of the Group Repository
"""
from typing import List, Optional
from sqlmodel import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.core.rbac.group_repository import IGroupRepository
from app.domain.core.rbac.group import Group, UserGroup, GroupRole
from app.domain.core.rbac.entity import Role
from app.infrastructure.shared.database.platform_models import (
    GroupModel,
    UserGroupModel,
    GroupRoleModel,
    RoleModel
)
from app.infrastructure.core.rbac.group_mapper import GroupMapper
from app.infrastructure.core.rbac.role_mapper import RoleMapper


class GroupRepository(IGroupRepository):
    """SQLModel implementation of group repository"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    # Group CRUD operations
    
    async def create(self, group: Group) -> Group:
        """Create a new group"""
        model = GroupMapper.to_model(group)
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return GroupMapper.to_entity(model)
    
    async def get_by_id(self, group_id: str, tenant_id: str) -> Optional[Group]:
        """Get group by ID"""
        statement = select(GroupModel).where(
            and_(
                GroupModel.id == group_id,
                GroupModel.tenant_id == tenant_id
            )
        )
        result = await self.session.execute(statement)
        model = result.scalar_one_or_none()
        return GroupMapper.to_entity(model) if model else None
    
    async def get_by_name(self, name: str, tenant_id: str) -> Optional[Group]:
        """Get group by name"""
        statement = select(GroupModel).where(
            and_(
                GroupModel.name == name,
                GroupModel.tenant_id == tenant_id
            )
        )
        result = await self.session.execute(statement)
        model = result.scalar_one_or_none()
        return GroupMapper.to_entity(model) if model else None
    
    async def list_by_tenant(self, tenant_id: str, include_inactive: bool = False) -> List[Group]:
        """List all groups for a tenant"""
        statement = select(GroupModel).where(GroupModel.tenant_id == tenant_id)
        
        if not include_inactive:
            statement = statement.where(GroupModel.is_active == True)
        
        result = await self.session.execute(statement)
        models = result.scalars().all()
        return [GroupMapper.to_entity(model) for model in models]
    
    async def update(self, group: Group) -> Group:
        """Update a group"""
        statement = select(GroupModel).where(
            and_(
                GroupModel.id == group.id,
                GroupModel.tenant_id == group.tenant_id
            )
        )
        result = await self.session.execute(statement)
        model = result.scalar_one_or_none()
        
        if not model:
            raise ValueError(f"Group {group.id} not found")
        
        # Update fields
        model.name = group.name
        model.description = group.description
        model.is_active = group.is_active
        model.updated_at = group.updated_at
        
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return GroupMapper.to_entity(model)
    
    async def delete(self, group_id: str, tenant_id: str) -> bool:
        """Delete a group"""
        statement = select(GroupModel).where(
            and_(
                GroupModel.id == group_id,
                GroupModel.tenant_id == tenant_id
            )
        )
        result = await self.session.execute(statement)
        model = result.scalar_one_or_none()
        
        if not model:
            return False
        
        await self.session.delete(model)
        await self.session.commit()
        return True
    
    # User-Group relationship (user membership in groups)
    
    async def add_user_to_group(self, user_group: UserGroup) -> UserGroup:
        """Add a user to a group (user becomes member)"""
        # Check if already exists
        statement = select(UserGroupModel).where(
            and_(
                UserGroupModel.user_id == user_group.user_id,
                UserGroupModel.group_id == user_group.group_id,
                UserGroupModel.tenant_id == user_group.tenant_id
            )
        )
        result = await self.session.execute(statement)
        existing = result.scalar_one_or_none()
        
        if existing:
            return user_group  # Already exists
        
        model = UserGroupModel(
            id=user_group.id,
            user_id=user_group.user_id,
            group_id=user_group.group_id,
            tenant_id=user_group.tenant_id,
            added_by=user_group.added_by,
            added_at=user_group.added_at
        )
        self.session.add(model)
        await self.session.commit()
        return user_group
    
    async def remove_user_from_group(self, user_id: str, group_id: str, tenant_id: str) -> bool:
        """Remove a user from a group"""
        statement = select(UserGroupModel).where(
            and_(
                UserGroupModel.user_id == user_id,
                UserGroupModel.group_id == group_id,
                UserGroupModel.tenant_id == tenant_id
            )
        )
        result = await self.session.execute(statement)
        model = result.scalar_one_or_none()
        
        if not model:
            return False
        
        await self.session.delete(model)
        await self.session.commit()
        return True
    
    async def get_user_groups(self, user_id: str, tenant_id: str) -> List[Group]:
        """Get all groups a user belongs to"""
        statement = (
            select(GroupModel)
            .join(UserGroupModel, GroupModel.id == UserGroupModel.group_id)
            .where(
                and_(
                    UserGroupModel.user_id == user_id,
                    UserGroupModel.tenant_id == tenant_id,
                    GroupModel.is_active == True
                )
            )
        )
        result = await self.session.execute(statement)
        models = result.scalars().all()
        return [GroupMapper.to_entity(model) for model in models]
    
    async def get_group_users(self, group_id: str, tenant_id: str) -> List[str]:
        """Get all user IDs in a group"""
        statement = select(UserGroupModel.user_id).where(
            and_(
                UserGroupModel.group_id == group_id,
                UserGroupModel.tenant_id == tenant_id
            )
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())
    
    async def is_user_in_group(self, user_id: str, group_id: str, tenant_id: str) -> bool:
        """Check if a user is in a group"""
        statement = select(UserGroupModel).where(
            and_(
                UserGroupModel.user_id == user_id,
                UserGroupModel.group_id == group_id,
                UserGroupModel.tenant_id == tenant_id
            )
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none() is not None
    
    # Group-Role relationship (roles that belong to the group)
    
    async def add_role_to_group(self, group_role: GroupRole) -> GroupRole:
        """Add a role to a group (all group members inherit this role)"""
        # Check if already exists
        statement = select(GroupRoleModel).where(
            and_(
                GroupRoleModel.group_id == group_role.group_id,
                GroupRoleModel.role_id == group_role.role_id,
                GroupRoleModel.tenant_id == group_role.tenant_id
            )
        )
        result = await self.session.execute(statement)
        existing = result.scalar_one_or_none()
        
        if existing:
            return group_role  # Already exists
        
        model = GroupRoleModel(
            id=group_role.id,
            group_id=group_role.group_id,
            role_id=group_role.role_id,
            tenant_id=group_role.tenant_id,
            added_by=group_role.added_by,
            added_at=group_role.added_at
        )
        self.session.add(model)
        await self.session.commit()
        return group_role
    
    async def remove_role_from_group(self, group_id: str, role_id: str, tenant_id: str) -> bool:
        """Remove a role from a group"""
        statement = select(GroupRoleModel).where(
            and_(
                GroupRoleModel.group_id == group_id,
                GroupRoleModel.role_id == role_id,
                GroupRoleModel.tenant_id == tenant_id
            )
        )
        result = await self.session.execute(statement)
        model = result.scalar_one_or_none()
        
        if not model:
            return False
        
        await self.session.delete(model)
        await self.session.commit()
        return True
    
    async def get_group_roles(self, group_id: str, tenant_id: str) -> List[Role]:
        """Get all roles that belong to a group"""
        statement = (
            select(RoleModel)
            .join(GroupRoleModel, RoleModel.id == GroupRoleModel.role_id)
            .where(
                and_(
                    GroupRoleModel.group_id == group_id,
                    GroupRoleModel.tenant_id == tenant_id
                )
            )
        )
        result = await self.session.execute(statement)
        models = result.scalars().all()
        return [RoleMapper.to_entity(model) for model in models]
    
    async def is_role_in_group(self, group_id: str, role_id: str, tenant_id: str) -> bool:
        """Check if a role belongs to a group"""
        statement = select(GroupRoleModel).where(
            and_(
                GroupRoleModel.group_id == group_id,
                GroupRoleModel.role_id == role_id,
                GroupRoleModel.tenant_id == tenant_id
            )
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none() is not None
    
    async def get_user_roles_from_groups(self, user_id: str, tenant_id: str) -> List[Role]:
        """
        Get all roles a user has through their group memberships (Method 2)
        
        This combines:
        1. Get all groups the user belongs to
        2. Get all roles from those groups
        3. Return deduplicated list of roles
        """
        statement = (
            select(RoleModel)
            .join(GroupRoleModel, RoleModel.id == GroupRoleModel.role_id)
            .join(GroupModel, GroupModel.id == GroupRoleModel.group_id)
            .join(UserGroupModel, UserGroupModel.group_id == GroupModel.id)
            .where(
                and_(
                    UserGroupModel.user_id == user_id,
                    UserGroupModel.tenant_id == tenant_id,
                    GroupModel.is_active == True
                )
            )
            .distinct()
        )
        result = await self.session.execute(statement)
        models = result.scalars().all()
        return [RoleMapper.to_entity(model) for model in models]
    
    async def get_groups_member_counts(self, group_ids: List[str], tenant_id: str) -> dict[str, int]:
        """
        Get member counts for multiple groups in a single query
        Returns a dict mapping group_id to member count
        """
        from sqlalchemy import func
        
        if not group_ids:
            return {}
        
        statement = (
            select(
                UserGroupModel.group_id,
                func.count(UserGroupModel.user_id).label('count')
            )
            .where(
                and_(
                    UserGroupModel.group_id.in_(group_ids),
                    UserGroupModel.tenant_id == tenant_id
                )
            )
            .group_by(UserGroupModel.group_id)
        )
        result = await self.session.execute(statement)
        rows = result.all()
        return {str(row.group_id): int(row.count) for row in rows}
    
    async def get_groups_role_counts(self, group_ids: List[str], tenant_id: str) -> dict[str, int]:
        """
        Get role counts for multiple groups in a single query
        Returns a dict mapping group_id to role count
        """
        from sqlalchemy import func
        
        if not group_ids:
            return {}
        
        statement = (
            select(
                GroupRoleModel.group_id,
                func.count(GroupRoleModel.role_id).label('count')
            )
            .where(
                and_(
                    GroupRoleModel.group_id.in_(group_ids),
                    GroupRoleModel.tenant_id == tenant_id
                )
            )
            .group_by(GroupRoleModel.group_id)
        )
        result = await self.session.execute(statement)
        rows = result.all()
        return {str(row.group_id): int(row.count) for row in rows}

