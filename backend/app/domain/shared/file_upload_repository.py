"""
File upload repository interface - Port in Hexagonal Architecture
"""
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional
from app.domain.shared.file_upload import FileUpload


class FileUploadRepository(ABC):
    """File upload repository interface"""
    
    @abstractmethod
    async def save(self, file_upload: FileUpload) -> FileUpload:
        """Save or update a file upload"""
        pass
    
    @abstractmethod
    async def get_by_id(self, file_id: str) -> Optional[FileUpload]:
        """Get file upload by ID"""
        pass
    
    @abstractmethod
    async def get_by_filename(self, filename: str) -> Optional[FileUpload]:
        """Get file upload by filename"""
        pass
    
    @abstractmethod
    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        uploaded_by: Optional[str] = None,
        mime_type: Optional[str] = None,
        uploaded_after: Optional[datetime] = None,
        uploaded_before: Optional[datetime] = None,
    ) -> List[FileUpload]:
        """Get all file uploads with pagination and filtering"""
        pass
    
    @abstractmethod
    async def delete(self, file_id: str) -> bool:
        """Delete file upload by ID"""
        pass
    
    @abstractmethod
    async def count_all(
        self,
        uploaded_by: Optional[str] = None,
        mime_type: Optional[str] = None,
        uploaded_after: Optional[datetime] = None,
        uploaded_before: Optional[datetime] = None,
    ) -> int:
        """Count all file uploads matching filters"""
        pass
