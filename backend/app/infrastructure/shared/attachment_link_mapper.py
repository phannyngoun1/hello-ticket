"""
Mapper for converting between AttachmentLink entity and AttachmentLinkModel
"""
from typing import Optional
from app.domain.shared.attachment_link import AttachmentLink
from app.infrastructure.shared.database.models import AttachmentLinkModel
from app.infrastructure.shared.mapper import BaseMapper


class AttachmentLinkMapper(BaseMapper[AttachmentLink, AttachmentLinkModel]):
    """Mapper for AttachmentLink entity <-> AttachmentLinkModel"""
    
    def to_domain(self, model: AttachmentLinkModel) -> Optional[AttachmentLink]:
        """Convert AttachmentLinkModel to AttachmentLink entity"""
        if not model:
            return None
        
        return AttachmentLink(
            file_upload_id=model.file_upload_id,
            entity_type=model.entity_type,
            entity_id=model.entity_id,
            attachment_type=model.attachment_type,
            attachment_link_id=model.id,
            tenant_id=model.tenant_id,
            created_at=model.created_at,
        )
    
    def to_model(self, entity: AttachmentLink) -> Optional[AttachmentLinkModel]:
        """Convert AttachmentLink entity to AttachmentLinkModel"""
        if not entity:
            return None
            
        return AttachmentLinkModel(
            id=entity.attachment_link_id,
            tenant_id=entity.tenant_id,
            file_upload_id=entity.file_upload_id,
            entity_type=entity.entity_type,
            entity_id=entity.entity_id,
            attachment_type=entity.attachment_type,
            created_at=entity.created_at,
        )
