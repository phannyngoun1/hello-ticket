"""FastAPI routes for Ticketing sections"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.domain.shared.file_upload_repository import FileUploadRepository
from app.presentation.api.ticketing.schemas_layout import (
    SectionCreateRequest,
    SectionUpdateRequest,
    SectionResponse,
    SectionListResponse,
)
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.core.routes.upload_routes import get_file_upload_repository
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import set_tenant_context
from app.infrastructure.shared.database.models import SectionModel
from app.infrastructure.shared.database.connection import get_session_sync
from sqlmodel import select, and_
from app.shared.utils import generate_id
from datetime import datetime, timezone

# Permission constants
MANAGE_PERMISSION = Permission.MANAGE_TICKETING_VENUE
VIEW_PERMISSION = Permission.VIEW_TICKETING_VENUE

router = APIRouter(prefix="/ticketing/sections", tags=["ticketing"])


def section_model_to_response(section: SectionModel, image_url: str | None = None) -> SectionResponse:
    """Convert SectionModel to SectionResponse"""
    return SectionResponse(
        id=section.id,
        tenant_id=section.tenant_id,
        layout_id=section.layout_id,
        name=section.name,
        x_coordinate=section.x_coordinate,
        y_coordinate=section.y_coordinate,
        file_id=section.file_id,
        image_url=image_url,
        is_active=section.is_active,
        created_at=section.created_at,
        updated_at=section.updated_at,
    )


@router.post("", response_model=SectionResponse, status_code=201)
async def create_section(
    request: SectionCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository),
):
    """Create a new section"""
    try:
        set_tenant_context(current_user.tenant_id)
        
        with get_session_sync() as session:
            # Check if section with same name already exists for this layout
            statement = select(SectionModel).where(
                SectionModel.layout_id == request.layout_id,
                SectionModel.name == request.name,
                SectionModel.is_deleted == False
            )
            existing = session.exec(statement).first()
            if existing:
                raise BusinessRuleError(f"Section with name '{request.name}' already exists for this layout")
            
            # Create new section
            section = SectionModel(
                id=generate_id(),
                tenant_id=current_user.tenant_id,
                layout_id=request.layout_id,
                name=request.name,
                x_coordinate=request.x_coordinate,
                y_coordinate=request.y_coordinate,
                file_id=request.file_id,
                is_active=True,
                is_deleted=False,
                version=0,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(section)
            session.commit()
            session.refresh(section)
            
            # Fetch file URL if file_id exists
            image_url = None
            if section.file_id:
                file_upload = await file_upload_repo.get_by_id(section.file_id)
                if file_upload:
                    image_url = file_upload.url
            
            return section_model_to_response(section, image_url)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/layout/{layout_id}", response_model=SectionListResponse)
async def list_sections_by_layout(
    layout_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository),
):
    """Get all sections for a layout"""
    try:
        set_tenant_context(current_user.tenant_id)
        
        with get_session_sync() as session:
            statement = select(SectionModel).where(
                SectionModel.layout_id == layout_id,
                SectionModel.tenant_id == current_user.tenant_id,
                SectionModel.is_deleted == False
            )
            sections = session.exec(statement).all()
            
            # Fetch file URLs for all sections
            items = []
            for section in sections:
                image_url = None
                if section.file_id:
                    file_upload = await file_upload_repo.get_by_id(section.file_id)
                    if file_upload:
                        image_url = file_upload.url
                items.append(section_model_to_response(section, image_url))
            
            return SectionListResponse(items=items)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{section_id}", response_model=SectionResponse)
async def get_section(
    section_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository),
):
    """Get a section by ID"""
    try:
        set_tenant_context(current_user.tenant_id)
        
        with get_session_sync() as session:
            statement = select(SectionModel).where(
                SectionModel.id == section_id,
                SectionModel.tenant_id == current_user.tenant_id,
                SectionModel.is_deleted == False
            )
            section = session.exec(statement).first()
            if not section:
                raise NotFoundError(f"Section {section_id} not found")
            
            # Fetch file URL if file_id exists
            image_url = None
            if section.file_id:
                file_upload = await file_upload_repo.get_by_id(section.file_id)
                if file_upload:
                    image_url = file_upload.url
            
            return section_model_to_response(section, image_url)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{section_id}", response_model=SectionResponse)
async def update_section(
    section_id: str,
    request: SectionUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository),
):
    """Update a section"""
    try:
        set_tenant_context(current_user.tenant_id)
        
        with get_session_sync() as session:
            statement = select(SectionModel).where(
                SectionModel.id == section_id,
                SectionModel.tenant_id == current_user.tenant_id,
                SectionModel.is_deleted == False
            )
            section = session.exec(statement).first()
            if not section:
                raise NotFoundError(f"Section {section_id} not found")
            
            # Check if name change would conflict with existing section
            if request.name and request.name != section.name:
                check_statement = select(SectionModel).where(
                    SectionModel.layout_id == section.layout_id,
                    SectionModel.name == request.name,
                    SectionModel.id != section_id,
                    SectionModel.is_deleted == False
                )
                existing = session.exec(check_statement).first()
                if existing:
                    raise BusinessRuleError(f"Section with name '{request.name}' already exists for this layout")
            
            # Update section
            if request.name is not None:
                section.name = request.name
            if request.x_coordinate is not None:
                section.x_coordinate = request.x_coordinate
            if request.y_coordinate is not None:
                section.y_coordinate = request.y_coordinate
            if request.file_id is not None:
                section.file_id = request.file_id
            
            section.updated_at = datetime.now(timezone.utc)
            section.version += 1
            
            session.add(section)
            session.commit()
            session.refresh(section)
            
            # Fetch file URL if file_id exists
            image_url = None
            if section.file_id:
                file_upload = await file_upload_repo.get_by_id(section.file_id)
                if file_upload:
                    image_url = file_upload.url
            
            return section_model_to_response(section, image_url)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{section_id}", status_code=204)
async def delete_section(
    section_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
):
    """Delete a section (soft delete)"""
    try:
        set_tenant_context(current_user.tenant_id)
        
        with get_session_sync() as session:
            statement = select(SectionModel).where(
                SectionModel.id == section_id,
                SectionModel.tenant_id == current_user.tenant_id,
                SectionModel.is_deleted == False
            )
            section = session.exec(statement).first()
            if not section:
                raise NotFoundError(f"Section {section_id} not found")
            
            # Check if section has seats (soft check via SeatModel)
            from app.infrastructure.shared.database.models import SeatModel
            seat_statement = select(SeatModel).where(
                SeatModel.section_id == section_id,
                SeatModel.is_deleted == False
            ).limit(1)
            has_seats = session.exec(seat_statement).first() is not None
            
            if has_seats:
                raise BusinessRuleError("Cannot delete section that has seats. Delete seats first.")
            
            # Soft delete
            section.is_deleted = True
            section.deleted_at = datetime.now(timezone.utc)
            section.version += 1
            
            session.add(section)
            session.commit()
            
            from fastapi import Response
            return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

