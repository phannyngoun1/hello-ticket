"""Attachment API schemas"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class FileUploadResponse(BaseModel):
    """File upload response model"""
    id: str
    filename: str
    original_name: str
    mime_type: str
    size: int
    url: str
    uploaded_at: str
    uploaded_by: Optional[str] = None


class LinkAttachmentRequest(BaseModel):
    """Payload to link a file upload to an entity"""
    file_upload_id: str = Field(..., description="ID of the file upload to link")
    attachment_type: str = Field(default="document", description="Type of attachment (e.g., 'document', 'profile_photo')")


class SetAttachmentsRequest(BaseModel):
    """Payload to set attachments for an entity"""
    file_upload_ids: List[str] = Field(..., description="List of file upload IDs to link to the entity")
    attachment_type: str = Field(default="document", description="Type of attachment")


class SetProfilePhotoRequest(BaseModel):
    """Payload to set profile photo for an entity"""
    file_upload_id: str = Field(..., description="ID of the file upload to use as profile photo")


class AttachmentListResponse(BaseModel):
    """List of attachments response model"""
    items: List[FileUploadResponse] = Field(default_factory=list)
    total: int = 0

