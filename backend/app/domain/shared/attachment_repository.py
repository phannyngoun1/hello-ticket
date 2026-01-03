"""Attachment repository interface - Port in Hexagonal Architecture"""
from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.shared.file_upload import FileUpload
from app.domain.shared.attachment_link import AttachmentLink


class AttachmentLinkRepository(ABC):
    """Abstract attachment link repository for managing file-entity relationships"""
    
    @abstractmethod
    async def link_attachment(
        self,
        tenant_id: str,
        file_upload_id: str,
        entity_type: str,
        entity_id: str,
        attachment_type: str = "document",
    ) -> AttachmentLink:
        """Link a file upload to an entity"""
        pass
    
    @abstractmethod
    async def unlink_attachment(
        self,
        tenant_id: str,
        file_upload_id: str,
        entity_type: str,
        entity_id: str,
    ) -> bool:
        """Unlink a file upload from an entity"""
        pass
    
    @abstractmethod
    async def get_attachments_for_entity(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
        attachment_type: Optional[str] = None,
    ) -> List[FileUpload]:
        """Get all file uploads linked to an entity, optionally filtered by attachment type"""
        pass
    
    @abstractmethod
    async def get_entities_for_file(
        self,
        tenant_id: str,
        file_upload_id: str,
        entity_type: Optional[str] = None,
    ) -> List[AttachmentLink]:
        """Get all entities linked to a file upload"""
        pass
    
    @abstractmethod
    async def set_attachments_for_entity(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
        file_upload_ids: List[str],
        attachment_type: str = "document",
    ) -> List[FileUpload]:
        """Set attachments for an entity (replaces existing attachments of the same type)"""
        pass
    
    @abstractmethod
    async def unlink_all_attachments(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
        attachment_type: Optional[str] = None,
    ) -> bool:
        """Unlink all attachments from an entity, optionally filtered by attachment type"""
        pass
    
    @abstractmethod
    async def get_profile_photo(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
    ) -> Optional[FileUpload]:
        """Get the profile photo for an entity (if exists)"""
        pass
    
    @abstractmethod
    async def set_profile_photo(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
        file_upload_id: str,
    ) -> FileUpload:
        """Set the profile photo for an entity (replaces existing profile photo)"""
        pass

