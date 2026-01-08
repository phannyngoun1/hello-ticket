"""
Mapper for converting between Group entity and GroupModel
"""
from typing import Optional
from app.domain.core.rbac.group import Group
from app.infrastructure.shared.database.platform_models import GroupModel
from app.infrastructure.shared.mapper import BaseMapper


class GroupMapper(BaseMapper[Group, GroupModel]):
    """Mapper for Group entity <-> GroupModel"""
    
    def to_domain(self, model: GroupModel) -> Optional[Group]:
        """Convert GroupModel to Group entity"""
        if not model:
            return None
        
        return Group(
            id=model.id,
            tenant_id=model.tenant_id,
            name=model.name,
            description=model.description,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def to_model(self, entity: Group) -> Optional[GroupModel]:
        """Convert Group entity to GroupModel"""
        if not entity:
            return None
        return GroupModel(
            id=entity.id,
            tenant_id=entity.tenant_id,
            name=entity.name,
            description=entity.description,
            is_active=entity.is_active,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )

