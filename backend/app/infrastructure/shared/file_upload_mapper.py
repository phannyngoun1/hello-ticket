"""
File upload mapper - handles conversion between domain entities and database models
"""
from app.domain.shared.file_upload import FileUpload
from app.infrastructure.shared.database.models import FileUploadModel


class FileUploadMapper:
    """Mapper for FileUpload entity to FileUploadModel conversion"""
    
    @staticmethod
    def to_domain(model: FileUploadModel) -> FileUpload:
        """Convert database model to domain entity
        
        Args:
            model: FileUploadModel from database
            
        Returns:
            FileUpload domain entity
        """
        return FileUpload(
            id=model.id,
            tenant_id=model.tenant_id,
            filename=model.filename,
            original_name=model.original_name,
            mime_type=model.mime_type,
            size=model.size,
            url=model.url,
            uploaded_by=model.uploaded_by,
            uploaded_at=model.uploaded_at,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    @staticmethod
    def to_model(file_upload: FileUpload) -> FileUploadModel:
        """Convert domain entity to database model
        
        Args:
            file_upload: FileUpload domain entity
            
        Returns:
            FileUploadModel for database persistence
        """
        return FileUploadModel(
            id=file_upload.id,
            tenant_id=file_upload.tenant_id,
            filename=file_upload.filename,
            original_name=file_upload.original_name,
            mime_type=file_upload.mime_type,
            size=file_upload.size,
            url=file_upload.url,
            uploaded_by=file_upload.uploaded_by,
            uploaded_at=file_upload.uploaded_at,
            created_at=file_upload.created_at,
            updated_at=file_upload.updated_at
        )
