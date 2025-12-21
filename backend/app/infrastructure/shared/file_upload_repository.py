"""
File upload repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from datetime import datetime
from sqlmodel import Session, select, and_
from sqlalchemy.exc import IntegrityError
from app.domain.shared.file_upload import FileUpload
from app.domain.shared.file_upload_repository import FileUploadRepository
from app.infrastructure.shared.database.models import FileUploadModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.shared.file_upload_mapper import FileUploadMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError


class SQLFileUploadRepository(FileUploadRepository):
    """SQLModel implementation of FileUploadRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._mapper = FileUploadMapper()
        self._tenant_id = tenant_id  # Override tenant context if provided
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, file_upload: FileUpload) -> FileUpload:
        """Save or update a file upload"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if file upload exists (within tenant scope)
            statement = select(FileUploadModel).where(
                FileUploadModel.id == file_upload.id,
                FileUploadModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                # Update existing file upload
                existing_model.filename = file_upload.filename
                existing_model.original_name = file_upload.original_name
                existing_model.mime_type = file_upload.mime_type
                existing_model.size = file_upload.size
                existing_model.url = file_upload.url
                existing_model.uploaded_by = file_upload.uploaded_by
                existing_model.uploaded_at = file_upload.uploaded_at
                existing_model.updated_at = file_upload.updated_at
                session.add(existing_model)
                try:
                    session.commit()
                    session.refresh(existing_model)
                    return self._mapper.to_domain(existing_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update file upload: {str(e)}")
            else:
                # Create new file upload
                new_model = self._mapper.to_model(file_upload)
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    return self._mapper.to_domain(new_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create file upload: {str(e)}")
    
    async def get_by_id(self, file_id: str) -> Optional[FileUpload]:
        """Get file upload by ID (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(FileUploadModel).where(
                FileUploadModel.id == file_id,
                FileUploadModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_filename(self, filename: str) -> Optional[FileUpload]:
        """Get file upload by filename (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(FileUploadModel).where(
                FileUploadModel.filename == filename,
                FileUploadModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        uploaded_by: Optional[str] = None,
        mime_type: Optional[str] = None,
        uploaded_after: Optional[datetime] = None,
        uploaded_before: Optional[datetime] = None,
    ) -> List[FileUpload]:
        """Get all file uploads with pagination and filtering (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Start with base query filtering by tenant
            conditions = [FileUploadModel.tenant_id == tenant_id]
            
            # Apply filters
            if uploaded_by:
                conditions.append(FileUploadModel.uploaded_by == uploaded_by)
            
            if mime_type:
                conditions.append(FileUploadModel.mime_type == mime_type)
            
            if uploaded_after:
                conditions.append(FileUploadModel.uploaded_at >= uploaded_after)
            
            if uploaded_before:
                conditions.append(FileUploadModel.uploaded_at <= uploaded_before)
            
            # Build final query
            statement = (
                select(FileUploadModel)
                .where(*conditions)
                .order_by(FileUploadModel.uploaded_at.desc())
                .offset(skip)
                .limit(limit)
            )
            
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def delete(self, file_id: str) -> bool:
        """Delete file upload by ID (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(FileUploadModel).where(
                FileUploadModel.id == file_id,
                FileUploadModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            
            if not model:
                return False
            
            session.delete(model)
            session.commit()
            return True
    
    async def count_all(
        self,
        uploaded_by: Optional[str] = None,
        mime_type: Optional[str] = None,
        uploaded_after: Optional[datetime] = None,
        uploaded_before: Optional[datetime] = None,
    ) -> int:
        """Count all file uploads matching filters (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Start with base query filtering by tenant
            conditions = [FileUploadModel.tenant_id == tenant_id]
            
            # Apply filters
            if uploaded_by:
                conditions.append(FileUploadModel.uploaded_by == uploaded_by)
            
            if mime_type:
                conditions.append(FileUploadModel.mime_type == mime_type)
            
            if uploaded_after:
                conditions.append(FileUploadModel.uploaded_at >= uploaded_after)
            
            if uploaded_before:
                conditions.append(FileUploadModel.uploaded_at <= uploaded_before)
            
            # Build count query
            statement = select(FileUploadModel).where(*conditions)
            count = len(session.exec(statement).all())
            return count
