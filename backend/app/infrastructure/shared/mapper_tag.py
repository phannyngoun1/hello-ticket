"""
Tag mapper - converts between domain Tag and database TagModel
"""
from app.domain.shared.tag import Tag
from app.infrastructure.shared.database.models import TagModel


class TagMapper:
    """Mapper for Tag domain entity and TagModel database model"""
    
    def to_domain(self, model: TagModel) -> Tag:
        """Convert database model to domain entity"""
        if not model:
            return None
        
        return Tag(
            tenant_id=model.tenant_id,
            name=model.name,
            entity_type=model.entity_type,
            tag_id=model.id,
            description=model.description,
            color=model.color,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    def to_model(self, tag: Tag) -> TagModel:
        """Convert domain entity to database model"""
        if not tag:
            return None
        
        return TagModel(
            id=tag.id,
            tenant_id=tag.tenant_id,
            name=tag.name,
            entity_type=tag.entity_type,
            description=tag.description,
            color=tag.color,
            is_active=tag.is_active,
            created_at=tag.created_at,
            updated_at=tag.updated_at,
            version=tag.version,
        )

