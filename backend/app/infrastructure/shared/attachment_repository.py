"""
Attachment repository implementation - Adapter in Hexagonal Architecture
"""
import asyncio
from typing import List, Optional
from sqlmodel import Session, select, and_
from sqlalchemy.exc import IntegrityError

from app.domain.shared.file_upload import FileUpload
from app.domain.shared.attachment_link import AttachmentLink
from app.domain.shared.attachment_repository import AttachmentLinkRepository
from app.domain.shared.file_upload_repository import FileUploadRepository
from app.infrastructure.shared.database.models import AttachmentLinkModel, FileUploadModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.shared.file_upload_mapper import FileUploadMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError


class SQLAttachmentLinkRepository(AttachmentLinkRepository):
    """SQLModel implementation of AttachmentLinkRepository"""
    
    def __init__(
        self,
        file_upload_repository: Optional[FileUploadRepository] = None,
        session_factory=None,
    ):
        self._session_factory = session_factory or get_session_sync
        self._file_upload_repository = file_upload_repository
        self._mapper = FileUploadMapper()
    
    async def link_attachment(
        self,
        tenant_id: str,
        file_upload_id: str,
        entity_type: str,
        entity_id: str,
        attachment_type: str = "document",
    ) -> AttachmentLink:
        """Link a file upload to an entity"""
        def _link_attachment_sync():
            """Synchronous function to link attachment"""
            session = self._session_factory()
            try:
                # Check if link already exists
                statement = select(AttachmentLinkModel).where(
                    and_(
                        AttachmentLinkModel.file_upload_id == file_upload_id,
                        AttachmentLinkModel.entity_type == entity_type.lower(),
                        AttachmentLinkModel.entity_id == entity_id,
                        AttachmentLinkModel.tenant_id == tenant_id
                    )
                )
                existing = session.exec(statement).first()
                
                if existing:
                    return AttachmentLink(
                        file_upload_id=existing.file_upload_id,
                        entity_type=existing.entity_type,
                        entity_id=existing.entity_id,
                        attachment_type=existing.attachment_type,
                        attachment_link_id=existing.id,
                        tenant_id=existing.tenant_id,
                        created_at=existing.created_at,
                    )
                
                # Create new link
                link_model = AttachmentLinkModel(
                    tenant_id=tenant_id,
                    file_upload_id=file_upload_id,
                    entity_type=entity_type.lower(),
                    entity_id=entity_id,
                    attachment_type=attachment_type.lower(),
                )
                session.add(link_model)
                try:
                    session.commit()
                    session.refresh(link_model)
                    return AttachmentLink(
                        file_upload_id=link_model.file_upload_id,
                        entity_type=link_model.entity_type,
                        entity_id=link_model.entity_id,
                        attachment_type=link_model.attachment_type,
                        attachment_link_id=link_model.id,
                        tenant_id=link_model.tenant_id,
                        created_at=link_model.created_at,
                    )
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to link attachment: {str(e)}")
            finally:
                session.close()
        
        return await asyncio.to_thread(_link_attachment_sync)
    
    async def unlink_attachment(
        self,
        tenant_id: str,
        file_upload_id: str,
        entity_type: str,
        entity_id: str,
    ) -> bool:
        """Unlink a file upload from an entity"""
        def _unlink_attachment_sync():
            """Synchronous function to unlink attachment"""
            session = self._session_factory()
            try:
                statement = select(AttachmentLinkModel).where(
                    and_(
                        AttachmentLinkModel.file_upload_id == file_upload_id,
                        AttachmentLinkModel.entity_type == entity_type.lower(),
                        AttachmentLinkModel.entity_id == entity_id,
                        AttachmentLinkModel.tenant_id == tenant_id
                    )
                )
                link_model = session.exec(statement).first()
                if not link_model:
                    return False
                
                session.delete(link_model)
                try:
                    session.commit()
                    return True
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to unlink attachment: {str(e)}")
            finally:
                session.close()
        
        return await asyncio.to_thread(_unlink_attachment_sync)
    
    async def get_attachments_for_entity(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
        attachment_type: Optional[str] = None,
    ) -> List[FileUpload]:
        """Get all file uploads linked to an entity, optionally filtered by attachment type"""
        def _get_attachments_sync():
            """Synchronous function to get attachments"""
            session = self._session_factory()
            try:
                conditions = [
                    AttachmentLinkModel.tenant_id == tenant_id,
                    AttachmentLinkModel.entity_type == entity_type.lower(),
                    AttachmentLinkModel.entity_id == entity_id,
                ]
                
                if attachment_type:
                    conditions.append(AttachmentLinkModel.attachment_type == attachment_type.lower())
                
                statement = (
                    select(FileUploadModel)
                    .join(AttachmentLinkModel, FileUploadModel.id == AttachmentLinkModel.file_upload_id)
                    .where(and_(*conditions))
                    .order_by(AttachmentLinkModel.created_at.desc())
                )
                models = session.exec(statement).all()
                return [self._mapper.to_domain(model) for model in models]
            finally:
                session.close()
        
        return await asyncio.to_thread(_get_attachments_sync)
    
    async def get_entities_for_file(
        self,
        tenant_id: str,
        file_upload_id: str,
        entity_type: Optional[str] = None,
    ) -> List[AttachmentLink]:
        """Get all entities linked to a file upload"""
        def _get_entities_sync():
            """Synchronous function to get entities"""
            session = self._session_factory()
            try:
                conditions = [
                    AttachmentLinkModel.tenant_id == tenant_id,
                    AttachmentLinkModel.file_upload_id == file_upload_id,
                ]
                
                if entity_type:
                    conditions.append(AttachmentLinkModel.entity_type == entity_type.lower())
                
                statement = select(AttachmentLinkModel).where(and_(*conditions))
                models = session.exec(statement).all()
                return [
                    AttachmentLink(
                        file_upload_id=model.file_upload_id,
                        entity_type=model.entity_type,
                        entity_id=model.entity_id,
                        attachment_type=model.attachment_type,
                        attachment_link_id=model.id,
                        tenant_id=model.tenant_id,
                        created_at=model.created_at,
                    )
                    for model in models
                ]
            finally:
                session.close()
        
        return await asyncio.to_thread(_get_entities_sync)
    
    async def set_attachments_for_entity(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
        file_upload_ids: List[str],
        attachment_type: str = "document",
    ) -> List[FileUpload]:
        """Set attachments for an entity (replaces existing attachments of the same type)"""
        def _set_attachments_sync():
            """Synchronous function to set attachments"""
            session = self._session_factory()
            try:
                # Deduplicate file_upload_ids
                unique_file_ids = list(set(f.strip() for f in file_upload_ids if f and f.strip()))
                
                # Remove existing links for this entity and attachment type
                delete_statement = select(AttachmentLinkModel).where(
                    and_(
                        AttachmentLinkModel.tenant_id == tenant_id,
                        AttachmentLinkModel.entity_type == entity_type.lower(),
                        AttachmentLinkModel.entity_id == entity_id,
                        AttachmentLinkModel.attachment_type == attachment_type.lower(),
                    )
                )
                existing_links = session.exec(delete_statement).all()
                for link in existing_links:
                    session.delete(link)
                
                session.flush()
                
                # Add new links
                files_to_return = []
                for file_id in unique_file_ids:
                    # Check if link already exists
                    existing_link_statement = select(AttachmentLinkModel).where(
                        and_(
                            AttachmentLinkModel.tenant_id == tenant_id,
                            AttachmentLinkModel.file_upload_id == file_id,
                            AttachmentLinkModel.entity_type == entity_type.lower(),
                            AttachmentLinkModel.entity_id == entity_id,
                        )
                    )
                    existing_link = session.exec(existing_link_statement).first()
                    
                    if not existing_link:
                        link_model = AttachmentLinkModel(
                            tenant_id=tenant_id,
                            file_upload_id=file_id,
                            entity_type=entity_type.lower(),
                            entity_id=entity_id,
                            attachment_type=attachment_type.lower(),
                        )
                        session.add(link_model)
                    
                    # Get file for return
                    file_statement = select(FileUploadModel).where(
                        and_(
                            FileUploadModel.id == file_id,
                            FileUploadModel.tenant_id == tenant_id,
                        )
                    )
                    file_model = session.exec(file_statement).first()
                    if file_model:
                        files_to_return.append(self._mapper.to_domain(file_model))
                
                session.commit()
                return files_to_return
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to set attachments: {str(e)}")
            finally:
                session.close()
        
        return await asyncio.to_thread(_set_attachments_sync)
    
    async def unlink_all_attachments(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
        attachment_type: Optional[str] = None,
    ) -> bool:
        """Unlink all attachments from an entity, optionally filtered by attachment type"""
        def _unlink_all_sync():
            """Synchronous function to unlink all attachments"""
            session = self._session_factory()
            try:
                conditions = [
                    AttachmentLinkModel.tenant_id == tenant_id,
                    AttachmentLinkModel.entity_type == entity_type.lower(),
                    AttachmentLinkModel.entity_id == entity_id,
                ]
                
                if attachment_type:
                    conditions.append(AttachmentLinkModel.attachment_type == attachment_type.lower())
                
                statement = select(AttachmentLinkModel).where(and_(*conditions))
                links = session.exec(statement).all()
                
                for link in links:
                    session.delete(link)
                
                session.commit()
                return True
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to unlink attachments: {str(e)}")
            finally:
                session.close()
        
        return await asyncio.to_thread(_unlink_all_sync)
    
    async def get_profile_photo(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
    ) -> Optional[FileUpload]:
        """Get the profile photo for an entity (if exists)"""
        attachments = await self.get_attachments_for_entity(
            tenant_id=tenant_id,
            entity_type=entity_type,
            entity_id=entity_id,
            attachment_type="profile_photo",
        )
        return attachments[0] if attachments else None
    
    async def set_profile_photo(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
        file_upload_id: str,
    ) -> FileUpload:
        """Set the profile photo for an entity (replaces existing profile photo)"""
        attachments = await self.set_attachments_for_entity(
            tenant_id=tenant_id,
            entity_type=entity_type,
            entity_id=entity_id,
            file_upload_ids=[file_upload_id],
            attachment_type="profile_photo",
        )
        if not attachments:
            raise BusinessRuleError(f"Failed to set profile photo: file upload {file_upload_id} not found")
        return attachments[0]

