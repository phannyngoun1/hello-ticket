"""
Role repository implementation
"""
from typing import List, Optional
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.core.rbac.entity import Role, UserRole
from app.domain.core.rbac.role_repository import IRoleRepository
from app.infrastructure.shared.database.platform_models import RoleModel, UserRoleModel
from app.shared.utils import generate_id
import json


class RoleRepository(IRoleRepository):
    """Implementation of role repository"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, role: Role) -> Role:
        """Create a new role"""
        model = RoleModel(
            id=role.id,
            tenant_id=role.tenant_id,
            name=role.name,
            description=role.description,
            permissions=json.dumps(role.permissions),
            is_active=role.is_active,
            is_system_role=role.is_system_role,
            created_by=role.created_by,
            created_at=role.created_at,
            updated_at=role.updated_at
        )
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def get_by_id(self, role_id: str, tenant_id: str) -> Optional[Role]:
        """Get role by ID"""
        statement = select(RoleModel).where(
            RoleModel.id == role_id,
            RoleModel.tenant_id == tenant_id
        )
        result = await self.session.execute(statement)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def get_by_name(self, name: str, tenant_id: str) -> Optional[Role]:
        """Get role by name"""
        statement = select(RoleModel).where(
            RoleModel.name == name,
            RoleModel.tenant_id == tenant_id
        )
        result = await self.session.execute(statement)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def list_by_tenant(self, tenant_id: str, include_inactive: bool = False) -> List[Role]:
        """List all roles for a tenant"""
        statement = select(RoleModel).where(RoleModel.tenant_id == tenant_id)
        if not include_inactive:
            statement = statement.where(RoleModel.is_active == True)
        statement = statement.order_by(RoleModel.name)
        
        result = await self.session.execute(statement)
        models = result.scalars().all()
        return [self._to_entity(model) for model in models]
    
    async def update(self, role: Role) -> Role:
        """Update a role"""
        statement = select(RoleModel).where(
            RoleModel.id == role.id,
            RoleModel.tenant_id == role.tenant_id
        )
        result = await self.session.execute(statement)
        model = result.scalar_one_or_none()
        
        if not model:
            raise ValueError(f"Role not found: {role.id}")
        
        model.name = role.name
        model.description = role.description
        model.permissions = json.dumps(role.permissions)
        model.is_active = role.is_active
        model.updated_at = role.updated_at
        
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def delete(self, role_id: str, tenant_id: str) -> bool:
        """Delete a role"""
        statement = select(RoleModel).where(
            RoleModel.id == role_id,
            RoleModel.tenant_id == tenant_id
        )
        result = await self.session.execute(statement)
        model = result.scalar_one_or_none()
        
        if not model:
            return False
        
        if model.is_system_role:
            raise ValueError("Cannot delete system roles")
        
        # Delete user-role relationships
        user_role_statement = select(UserRoleModel).where(
            UserRoleModel.role_id == role_id,
            UserRoleModel.tenant_id == tenant_id
        )
        user_role_result = await self.session.execute(user_role_statement)
        user_role_models = user_role_result.scalars().all()
        for user_role_model in user_role_models:
            await self.session.delete(user_role_model)
        
        # Delete role
        await self.session.delete(model)
        await self.session.commit()
        return True
    
    async def assign_role_to_user(self, user_role: UserRole, assigned_by: Optional[str] = None) -> UserRole:
        """Directly assign a role to a user
        
        Args:
            user_role: UserRole entity or value object
            assigned_by: ID of user performing the assignment (optional, defaults to None)
        """
        # Generate ID if not provided (for value objects that don't have id)
        user_role_id = getattr(user_role, 'id', None) or generate_id()
        
        # Use assigned_by parameter if provided, otherwise try to get from user_role object
        assigned_by_value = assigned_by or getattr(user_role, 'assigned_by', None)
        
        model = UserRoleModel(
            id=user_role_id,
            user_id=user_role.user_id,
            role_id=user_role.role_id,
            tenant_id=user_role.tenant_id,
            assigned_by=assigned_by_value,
            assigned_at=user_role.assigned_at
        )
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._user_role_to_entity(model)
    
    async def remove_role_from_user(self, user_id: str, role_id: str, tenant_id: str) -> bool:
        """Remove a directly assigned role from a user"""
        statement = select(UserRoleModel).where(
            UserRoleModel.user_id == user_id,
            UserRoleModel.role_id == role_id,
            UserRoleModel.tenant_id == tenant_id
        )
        result = await self.session.execute(statement)
        model = result.scalar_one_or_none()
        
        if not model:
            return False
        
        await self.session.delete(model)
        await self.session.commit()
        return True
    
    async def get_user_direct_roles(self, user_id: str, tenant_id: str) -> List[Role]:
        """Get all roles directly assigned to a user (not through groups)"""
        statement = (
            select(RoleModel)
            .join(UserRoleModel, RoleModel.id == UserRoleModel.role_id)
            .where(
                UserRoleModel.user_id == user_id,
                UserRoleModel.tenant_id == tenant_id,
                RoleModel.is_active == True
            )
            .order_by(RoleModel.name)
        )
        result = await self.session.execute(statement)
        models = result.scalars().all()
        return [self._to_entity(model) for model in models]
    
    async def get_user_roles(self, user_id: str, tenant_id: str) -> List[Role]:
        """
        Alias for get_user_direct_roles for backward compatibility
        
        Get all roles directly assigned to a user (not through groups)
        """
        return await self.get_user_direct_roles(user_id, tenant_id)
    
    async def is_role_assigned_to_user(self, user_id: str, role_id: str, tenant_id: str) -> bool:
        """Check if a role is directly assigned to a user"""
        statement = select(UserRoleModel).where(
            UserRoleModel.user_id == user_id,
            UserRoleModel.role_id == role_id,
            UserRoleModel.tenant_id == tenant_id
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none() is not None
    
    async def get_role_users(self, role_id: str, tenant_id: str) -> List[str]:
        """Get all user IDs who have this role assigned directly"""
        statement = select(UserRoleModel.user_id).where(
            UserRoleModel.role_id == role_id,
            UserRoleModel.tenant_id == tenant_id
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())
    
    def _to_entity(self, model: RoleModel) -> Role:
        """Convert model to entity"""
        permissions = json.loads(model.permissions) if model.permissions else []
        return Role(
            id=model.id,
            tenant_id=model.tenant_id,
            name=model.name,
            description=model.description,
            permissions=permissions,
            is_active=model.is_active,
            is_system_role=model.is_system_role,
            created_by=model.created_by,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def _user_role_to_entity(self, model: UserRoleModel) -> UserRole:
        """Convert user role model to entity"""
        return UserRole(
            id=model.id,
            user_id=model.user_id,
            role_id=model.role_id,
            tenant_id=model.tenant_id,
            assigned_by=model.assigned_by,
            assigned_at=model.assigned_at
        )

