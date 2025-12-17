"""
Mapper for converting between Group entity and GroupModel
"""
from typing import Optional
from app.domain.core.rbac.group import Group
from app.infrastructure.shared.database.platform_models import GroupModel


class GroupMapper:
    """Mapper for Group entity <-> GroupModel"""
    
    @staticmethod
    def to_entity(model: Optional[GroupModel]) -> Optional[Group]:
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
    
    @staticmethod
    def to_model(entity: Group) -> GroupModel:
        """Convert Group entity to GroupModel"""
        return GroupModel(
            id=entity.id,
            tenant_id=entity.tenant_id,
            name=entity.name,
            description=entity.description,
            is_active=entity.is_active,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )

