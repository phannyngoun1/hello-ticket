"""Handlers for attachment commands and queries."""
import logging
from typing import List, Optional

from app.application.shared.attachment_commands import (
    LinkAttachmentCommand,
    UnlinkAttachmentCommand,
    SetAttachmentsCommand,
    SetProfilePhotoCommand,
    RemoveProfilePhotoCommand,
)
from app.application.shared.attachment_queries import (
    GetAttachmentsForEntityQuery,
    GetProfilePhotoQuery,
)
from app.domain.shared.attachment_repository import AttachmentLinkRepository
from app.domain.shared.file_upload import FileUpload
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class AttachmentCommandHandler:
    """Handler for attachment commands"""

    def __init__(self, attachment_link_repository: AttachmentLinkRepository):
        self._attachment_link_repository = attachment_link_repository

    async def handle_link_attachment(self, command: LinkAttachmentCommand) -> None:
        """Link a file upload to an entity"""
        tenant_id = require_tenant_context()
        
        if not command.file_upload_id or not command.file_upload_id.strip():
            raise ValidationError("File upload ID is required")
        if not command.entity_type or not command.entity_type.strip():
            raise ValidationError("Entity type is required")
        if not command.entity_id or not command.entity_id.strip():
            raise ValidationError("Entity ID is required")
        
        await self._attachment_link_repository.link_attachment(
            tenant_id=tenant_id,
            file_upload_id=command.file_upload_id.strip(),
            entity_type=command.entity_type.strip(),
            entity_id=command.entity_id.strip(),
            attachment_type=command.attachment_type or "document",
        )
        logger.info(
            "Linked file %s to entity %s:%s as %s for tenant=%s",
            command.file_upload_id,
            command.entity_type,
            command.entity_id,
            command.attachment_type,
            tenant_id,
        )

    async def handle_unlink_attachment(self, command: UnlinkAttachmentCommand) -> None:
        """Unlink a file upload from an entity"""
        tenant_id = require_tenant_context()
        
        if not command.file_upload_id or not command.file_upload_id.strip():
            raise ValidationError("File upload ID is required")
        if not command.entity_type or not command.entity_type.strip():
            raise ValidationError("Entity type is required")
        if not command.entity_id or not command.entity_id.strip():
            raise ValidationError("Entity ID is required")
        
        unlinked = await self._attachment_link_repository.unlink_attachment(
            tenant_id=tenant_id,
            file_upload_id=command.file_upload_id.strip(),
            entity_type=command.entity_type.strip(),
            entity_id=command.entity_id.strip(),
        )
        
        if not unlinked:
            raise NotFoundError(
                f"Attachment link not found for file {command.file_upload_id} and entity {command.entity_type}:{command.entity_id}"
            )
        
        logger.info(
            "Unlinked file %s from entity %s:%s for tenant=%s",
            command.file_upload_id,
            command.entity_type,
            command.entity_id,
            tenant_id,
        )

    async def handle_set_attachments(self, command: SetAttachmentsCommand) -> List[FileUpload]:
        """Set attachments for an entity (replaces existing attachments of the same type)"""
        tenant_id = require_tenant_context()
        
        if not command.entity_type or not command.entity_type.strip():
            raise ValidationError("Entity type is required")
        if not command.entity_id or not command.entity_id.strip():
            raise ValidationError("Entity ID is required")
        
        attachments = await self._attachment_link_repository.set_attachments_for_entity(
            tenant_id=tenant_id,
            entity_type=command.entity_type.strip(),
            entity_id=command.entity_id.strip(),
            file_upload_ids=command.file_upload_ids or [],
            attachment_type=command.attachment_type or "document",
        )
        
        logger.info(
            "Set %d attachments for entity %s:%s (type: %s) for tenant=%s",
            len(attachments),
            command.entity_type,
            command.entity_id,
            command.attachment_type,
            tenant_id,
        )
        
        return attachments

    async def handle_set_profile_photo(self, command: SetProfilePhotoCommand) -> FileUpload:
        """Set profile photo for an entity"""
        tenant_id = require_tenant_context()
        
        if not command.entity_type or not command.entity_type.strip():
            raise ValidationError("Entity type is required")
        if not command.entity_id or not command.entity_id.strip():
            raise ValidationError("Entity ID is required")
        if not command.file_upload_id or not command.file_upload_id.strip():
            raise ValidationError("File upload ID is required")
        
        profile_photo = await self._attachment_link_repository.set_profile_photo(
            tenant_id=tenant_id,
            entity_type=command.entity_type.strip(),
            entity_id=command.entity_id.strip(),
            file_upload_id=command.file_upload_id.strip(),
        )
        
        logger.info(
            "Set profile photo for entity %s:%s (file: %s) for tenant=%s",
            command.entity_type,
            command.entity_id,
            command.file_upload_id,
            tenant_id,
        )
        
        return profile_photo

    async def handle_remove_profile_photo(self, command: RemoveProfilePhotoCommand) -> None:
        """Remove profile photo from an entity"""
        tenant_id = require_tenant_context()
        
        if not command.entity_type or not command.entity_type.strip():
            raise ValidationError("Entity type is required")
        if not command.entity_id or not command.entity_id.strip():
            raise ValidationError("Entity ID is required")
        
        unlinked = await self._attachment_link_repository.unlink_all_attachments(
            tenant_id=tenant_id,
            entity_type=command.entity_type.strip(),
            entity_id=command.entity_id.strip(),
            attachment_type="profile_photo",
        )
        
        if not unlinked:
            logger.warning(
                "No profile photo found to remove for entity %s:%s for tenant=%s",
                command.entity_type,
                command.entity_id,
                tenant_id,
            )
        else:
            logger.info(
                "Removed profile photo from entity %s:%s for tenant=%s",
                command.entity_type,
                command.entity_id,
                tenant_id,
            )


class AttachmentQueryHandler:
    """Handler for attachment queries"""

    def __init__(self, attachment_link_repository: AttachmentLinkRepository):
        self._attachment_link_repository = attachment_link_repository

    async def handle_get_attachments_for_entity(
        self, query: GetAttachmentsForEntityQuery
    ) -> List[FileUpload]:
        """Get all attachments for an entity"""
        tenant_id = require_tenant_context()
        
        if not query.entity_type or not query.entity_type.strip():
            raise ValidationError("Entity type is required")
        if not query.entity_id or not query.entity_id.strip():
            raise ValidationError("Entity ID is required")
        
        attachments = await self._attachment_link_repository.get_attachments_for_entity(
            tenant_id=tenant_id,
            entity_type=query.entity_type.strip(),
            entity_id=query.entity_id.strip(),
            attachment_type=query.attachment_type.strip() if query.attachment_type else None,
        )
        
        return attachments

    async def handle_get_profile_photo(self, query: GetProfilePhotoQuery) -> Optional[FileUpload]:
        """Get profile photo for an entity"""
        tenant_id = require_tenant_context()
        
        if not query.entity_type or not query.entity_type.strip():
            raise ValidationError("Entity type is required")
        if not query.entity_id or not query.entity_id.strip():
            raise ValidationError("Entity ID is required")
        
        profile_photo = await self._attachment_link_repository.get_profile_photo(
            tenant_id=tenant_id,
            entity_type=query.entity_type.strip(),
            entity_id=query.entity_id.strip(),
        )
        
        return profile_photo

