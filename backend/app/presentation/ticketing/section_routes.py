"""FastAPI routes for Ticketing sections"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
import json

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
    # Convert shape dict (from JSONB) to JSON string for API response
    shape_str = None
    if section.shape:
        if isinstance(section.shape, dict):
            shape_str = json.dumps(section.shape)
        elif isinstance(section.shape, str):
            # Already a string, use as-is
            shape_str = section.shape
        else:
            shape_str = json.dumps(section.shape)
    
    return SectionResponse(
        id=section.id,
        tenant_id=section.tenant_id,
        layout_id=section.layout_id,
        name=section.name,
        x_coordinate=section.x_coordinate,
        y_coordinate=section.y_coordinate,
        file_id=section.file_id,
        image_url=image_url,
        shape=shape_str,  # Return as JSON string for API compatibility
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
            # Check if section with same name already exists for this layout (including soft-deleted)
            # The unique constraint applies to all rows, so we need to check all
            statement = select(SectionModel).where(
                SectionModel.layout_id == request.layout_id,
                SectionModel.name == request.name,
                SectionModel.tenant_id == current_user.tenant_id
            )
            existing = session.exec(statement).first()
            if existing:
                if existing.is_deleted:
                    # Hard delete the soft-deleted section to allow reuse of the name
                    session.delete(existing)
                    session.flush()  # Flush to remove it before creating new one
                else:
                    raise BusinessRuleError(f"Section with name '{request.name}' already exists for this layout")
            
            # Parse shape if provided (convert JSON string to dict for JSONB storage)
            shape_data = None
            if request.shape:
                if isinstance(request.shape, str):
                    try:
                        shape_data = json.loads(request.shape)
                    except json.JSONDecodeError:
                        raise ValidationError(f"Invalid JSON in shape field: {request.shape}")
                elif isinstance(request.shape, dict):
                    shape_data = request.shape
                else:
                    shape_data = request.shape
            
            # Create new section
            section = SectionModel(
                id=generate_id(),
                tenant_id=current_user.tenant_id,
                layout_id=request.layout_id,
                name=request.name,
                x_coordinate=request.x_coordinate,
                y_coordinate=request.y_coordinate,
                file_id=request.file_id,
                shape=shape_data,  # Store as dict - JSONB column will handle serialization
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
            if request.shape is not None:
                # Parse shape if provided (convert JSON string to dict for JSONB storage)
                shape_data = None
                if isinstance(request.shape, str):
                    try:
                        shape_data = json.loads(request.shape)
                    except json.JSONDecodeError:
                        raise ValidationError(f"Invalid JSON in shape field: {request.shape}")
                elif isinstance(request.shape, dict):
                    shape_data = request.shape
                else:
                    shape_data = request.shape
                
                section.shape = shape_data  # Store as dict - JSONB column will handle serialization
            
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
    """Delete a section (soft delete) and all its related seats"""
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
            
            # Soft delete all seats associated with this section
            from app.infrastructure.shared.database.models import SeatModel
            seat_statement = select(SeatModel).where(
                SeatModel.section_id == section_id,
                SeatModel.tenant_id == current_user.tenant_id,
                SeatModel.is_deleted == False
            )
            seats = session.exec(seat_statement).all()
            
            deleted_at = datetime.now(timezone.utc)
            
            # Soft delete all related seats
            for seat in seats:
                seat.is_deleted = True
                seat.deleted_at = deleted_at
                seat.updated_at = deleted_at
                session.add(seat)
            
            # Soft delete the section
            section.is_deleted = True
            section.deleted_at = deleted_at
            section.version += 1
            
            session.add(section)
            session.commit()
            
            from fastapi import Response
            return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

