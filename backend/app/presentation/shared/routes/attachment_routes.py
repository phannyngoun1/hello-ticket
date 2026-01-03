"""
Attachment routes for managing file attachments to entities
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

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
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.shared.schemas_attachment import (
    FileUploadResponse,
    LinkAttachmentRequest,
    SetAttachmentsRequest,
    SetProfilePhotoRequest,
    AttachmentListResponse,
)
from app.presentation.core.dependencies.auth_dependencies import RequirePermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/shared/attachments", tags=["attachments"])


def file_upload_to_response(file_upload) -> FileUploadResponse:
    """Convert domain file upload to response"""
    return FileUploadResponse(
        id=file_upload.id,
        filename=file_upload.filename,
        original_name=file_upload.original_name,
        mime_type=file_upload.mime_type,
        size=file_upload.size,
        url=file_upload.url,
        uploaded_at=file_upload.uploaded_at.isoformat() if file_upload.uploaded_at else "",
        uploaded_by=file_upload.uploaded_by,
    )


@router.post("/entity/{entity_type}/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def link_attachment(
    entity_type: str,
    entity_id: str,
    request: LinkAttachmentRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Link a file upload to an entity"""
    try:
        command = LinkAttachmentCommand(
            file_upload_id=request.file_upload_id,
            entity_type=entity_type,
            entity_id=entity_id,
            attachment_type=request.attachment_type,
        )
        await mediator.send(command)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/entity/{entity_type}/{entity_id}/{file_upload_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_attachment(
    entity_type: str,
    entity_id: str,
    file_upload_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Unlink a file upload from an entity"""
    try:
        command = UnlinkAttachmentCommand(
            file_upload_id=file_upload_id,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        await mediator.send(command)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.put("/entity/{entity_type}/{entity_id}", response_model=AttachmentListResponse)
async def set_attachments(
    entity_type: str,
    entity_id: str,
    request: SetAttachmentsRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Set attachments for an entity (replaces existing attachments of the same type)"""
    try:
        command = SetAttachmentsCommand(
            entity_type=entity_type,
            entity_id=entity_id,
            file_upload_ids=request.file_upload_ids,
            attachment_type=request.attachment_type,
        )
        attachments = await mediator.send(command)
        return AttachmentListResponse(
            items=[file_upload_to_response(att) for att in attachments],
            total=len(attachments),
        )
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get("/entity/{entity_type}/{entity_id}", response_model=AttachmentListResponse)
async def get_attachments(
    entity_type: str,
    entity_id: str,
    attachment_type: Optional[str] = None,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Get all attachments for an entity"""
    try:
        query = GetAttachmentsForEntityQuery(
            entity_type=entity_type,
            entity_id=entity_id,
            attachment_type=attachment_type,
        )
        attachments = await mediator.query(query)
        return AttachmentListResponse(
            items=[file_upload_to_response(att) for att in attachments],
            total=len(attachments),
        )
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.put("/entity/{entity_type}/{entity_id}/profile-photo", response_model=FileUploadResponse)
async def set_profile_photo(
    entity_type: str,
    entity_id: str,
    request: SetProfilePhotoRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Set profile photo for an entity"""
    try:
        command = SetProfilePhotoCommand(
            entity_type=entity_type,
            entity_id=entity_id,
            file_upload_id=request.file_upload_id,
        )
        profile_photo = await mediator.send(command)
        return file_upload_to_response(profile_photo)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/entity/{entity_type}/{entity_id}/profile-photo", status_code=status.HTTP_204_NO_CONTENT)
async def remove_profile_photo(
    entity_type: str,
    entity_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Remove profile photo from an entity"""
    try:
        command = RemoveProfilePhotoCommand(
            entity_type=entity_type,
            entity_id=entity_id,
        )
        await mediator.send(command)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get("/entity/{entity_type}/{entity_id}/profile-photo", response_model=Optional[FileUploadResponse])
async def get_profile_photo(
    entity_type: str,
    entity_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Get profile photo for an entity"""
    try:
        query = GetProfilePhotoQuery(
            entity_type=entity_type,
            entity_id=entity_id,
        )
        profile_photo = await mediator.query(query)
        return file_upload_to_response(profile_photo) if profile_photo else None
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

