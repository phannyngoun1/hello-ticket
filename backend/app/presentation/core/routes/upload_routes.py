"""
Upload routes for file management
"""
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile, status, Depends
from pydantic import BaseModel

from app.presentation.core.dependencies.auth_dependencies import get_current_active_user_from_request
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.file_upload import FileUpload
from app.domain.shared.file_upload_repository import FileUploadRepository
from app.infrastructure.shared.file_upload_repository import SQLFileUploadRepository
from app.shared.tenant_context import set_tenant_context


class FileUploadResponse(BaseModel):
    """File upload response"""
    id: str
    filename: str
    original_name: str
    mime_type: str
    size: int
    url: str
    uploaded_at: str


router = APIRouter(prefix="/upload", tags=["upload"])

# Configure upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Repository dependency
_file_upload_repo: Optional[FileUploadRepository] = None

def get_file_upload_repository() -> FileUploadRepository:
    """Get file upload repository instance"""
    global _file_upload_repo
    if _file_upload_repo is None:
        _file_upload_repo = SQLFileUploadRepository()
    return _file_upload_repo

# Allowed file types
ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
}

ALLOWED_DOCUMENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # .xlsx
    "text/plain",
    "text/csv",
}

ALLOWED_FILE_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_DOCUMENT_TYPES

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB for images
MAX_DOCUMENT_SIZE = 20 * 1024 * 1024  # 20MB for documents


@router.post("/", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_active_user_from_request),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository)
):
    """
    Upload a file
    
    - Validates file type and size
    - Generates unique filename
    - Saves file to upload directory
    - Saves file metadata to database
    - Returns file metadata and URL
    """
    # Set tenant context for repository
    set_tenant_context(current_user.tenant_id)
    
    # Validate file type
    if file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file.content_type} not allowed. Allowed types: images ({', '.join(ALLOWED_IMAGE_TYPES)}) and documents ({', '.join(ALLOWED_DOCUMENT_TYPES)})"
        )
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Validate file size based on file type
    max_size = MAX_IMAGE_SIZE if file.content_type in ALLOWED_IMAGE_TYPES else MAX_DOCUMENT_SIZE
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size {file_size} bytes exceeds maximum allowed size of {max_size} bytes for {file.content_type}"
        )
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix if file.filename else ""
    unique_filename = f"{file_id}{file_extension}"
    
    # Save file to filesystem
    file_path = UPLOAD_DIR / unique_filename
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Generate URL (adjust based on your deployment)
    # For now, using relative path - adjust based on your setup
    file_url = f"/uploads/{unique_filename}"
    
    # Create file upload domain entity
    uploaded_at = datetime.now(timezone.utc)
    file_upload = FileUpload(
        id=file_id,
        tenant_id=current_user.tenant_id,
        filename=unique_filename,
        original_name=file.filename or "unknown",
        mime_type=file.content_type or "application/octet-stream",
        size=file_size,
        url=file_url,
        uploaded_by=current_user.id,
        uploaded_at=uploaded_at
    )
    
    # Save file metadata to database
    saved_file_upload = await file_upload_repo.save(file_upload)
    
    return FileUploadResponse(
        id=saved_file_upload.id,
        filename=saved_file_upload.filename,
        original_name=saved_file_upload.original_name,
        mime_type=saved_file_upload.mime_type,
        size=saved_file_upload.size,
        url=saved_file_upload.url,
        uploaded_at=saved_file_upload.uploaded_at.isoformat()
    )


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: str,
    current_user: AuthenticatedUser = Depends(get_current_active_user_from_request),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository)
):
    """
    Delete an uploaded file
    
    - Finds file by ID in database
    - Deletes file from storage
    - Deletes file metadata from database
    - Returns 204 No Content on success
    """
    # Set tenant context for repository
    set_tenant_context(current_user.tenant_id)
    
    # Get file upload from database
    file_upload = await file_upload_repo.get_by_id(file_id)
    
    if not file_upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File with ID {file_id} not found"
        )
    
    # Delete file from filesystem
    file_path = UPLOAD_DIR / file_upload.filename
    try:
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file from storage: {str(e)}"
        )
    
    # Delete file metadata from database
    deleted = await file_upload_repo.delete(file_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file metadata from database"
        )
    
    return None
