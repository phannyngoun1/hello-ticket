"""
Mapper for converting between Role entity and RoleModel
"""
import json
from typing import Optional
from app.domain.core.rbac.entity import Role
from app.infrastructure.shared.database.platform_models import RoleModel
from app.infrastructure.shared.mapper import BaseMapper


class RoleMapper(BaseMapper[Role, RoleModel]):
    """Mapper for Role entity <-> RoleModel"""
    
    def to_domain(self, model: RoleModel) -> Optional[Role]:
        """Convert RoleModel to Role entity"""
        if not model:
            return None
        
        # Parse permissions JSON string to list and filter out empty/whitespace permissions
        try:
            permission_strings = json.loads(model.permissions) if model.permissions else []
        except (json.JSONDecodeError, TypeError):
            permission_strings = []
        
        # Filter out empty or whitespace-only permissions (Role entity expects List[str])
        permissions = [
            perm 
            for perm in permission_strings 
            if perm and isinstance(perm, str) and perm.strip()
        ]
        
        return Role(
            id=model.id,
            tenant_id=model.tenant_id,
            name=model.name,
            permissions=permissions,
            description=model.description,
            is_system_role=model.is_system_role,
            created_by=model.created_by,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def to_model(self, entity: Role) -> Optional[RoleModel]:
        """Convert Role entity to RoleModel"""
        if not entity:
            return None
        # Role entity permissions are already strings, just serialize as JSON
        permissions_json = json.dumps(entity.permissions)
        
        return RoleModel(
            id=entity.id,
            tenant_id=entity.tenant_id,
            name=entity.name,
            permissions=permissions_json,
            description=entity.description,
            is_system_role=entity.is_system_role,
            created_by=entity.created_by,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )

