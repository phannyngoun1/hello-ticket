"""
File upload domain entity
"""
from datetime import datetime, timezone
from typing import Optional
from dataclasses import dataclass, field
from app.shared.utils import generate_id


@dataclass
class FileUpload:
    """File upload domain entity"""
    # Required fields
    tenant_id: str
    filename: str  # Unique filename on disk (UUID + extension)
    original_name: str  # Original filename from user
    mime_type: str
    size: int  # File size in bytes
    url: str  # URL path to access the file
    
    # Optional fields with defaults
    id: str = field(default_factory=generate_id)
    uploaded_by: Optional[str] = None  # User ID who uploaded
    uploaded_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    def __post_init__(self):
        """Validate file upload entity"""
        if not self.tenant_id:
            raise ValueError("tenant_id is required")
        if not self.filename:
            raise ValueError("filename is required")
        if not self.original_name:
            raise ValueError("original_name is required")
        if not self.mime_type:
            raise ValueError("mime_type is required")
        if self.size < 0:
            raise ValueError("size must be non-negative")
        if not self.url:
            raise ValueError("url is required")
    
    def update_uploaded_by(self, user_id: str) -> None:
        """Update the user who uploaded the file"""
        self.uploaded_by = user_id
        self.updated_at = datetime.now(timezone.utc)
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, FileUpload):
            return False
        return self.id == other.id and self.tenant_id == other.tenant_id
