"""FastAPI routes for Ticketing layouts"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional

from app.application.ticketing.commands_layout import (
    CreateLayoutCommand,
    UpdateLayoutCommand,
    DeleteLayoutCommand,
)
from app.application.ticketing.queries_layout import (
    GetLayoutByIdQuery,
    GetLayoutsByVenueIdQuery,
    GetLayoutWithSeatsQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.domain.shared.file_upload_repository import FileUploadRepository
from app.presentation.api.ticketing.schemas_layout import (
    LayoutCreateRequest,
    LayoutListResponse,
    LayoutResponse,
    LayoutUpdateRequest,
    LayoutWithSeatsResponse,
)
from app.presentation.api.ticketing.schemas_seat import SeatResponse
from app.presentation.api.ticketing.mapper_venue import TicketingApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.core.routes.upload_routes import get_file_upload_repository
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import set_tenant_context

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.MANAGE_TICKETING_VENUE
VIEW_PERMISSION = Permission.VIEW_TICKETING_VENUE

router = APIRouter(prefix="/ticketing/layouts", tags=["ticketing"])


@router.post("", response_model=LayoutResponse, status_code=201)
async def create_layout(
    request: LayoutCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository),
):
    """Create a new layout"""

    try:
        set_tenant_context(current_user.tenant_id)
        command = CreateLayoutCommand(
            venue_id=request.venue_id,
            name=request.name,
            description=request.description,
            file_id=request.file_id,
            design_mode=request.design_mode or "seat-level",
        )
        layout = await mediator.send(command)
        
        # Fetch file URL if file_id exists
        image_url = None
        if layout.file_id:
            file_upload = await file_upload_repo.get_by_id(layout.file_id)
            if file_upload:
                image_url = file_upload.url
        
        return TicketingApiMapper.layout_to_response(layout, image_url=image_url)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/venue/{venue_id}", response_model=LayoutListResponse)
async def list_layouts_by_venue(
    venue_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository),
):
    """Get all layouts for a venue"""

    try:
        set_tenant_context(current_user.tenant_id)
        layouts = await mediator.query(GetLayoutsByVenueIdQuery(venue_id=venue_id))
        
        # Fetch file URLs for all layouts
        items = []
        for layout in layouts:
            image_url = None
            if layout.file_id:
                file_upload = await file_upload_repo.get_by_id(layout.file_id)
                if file_upload:
                    image_url = file_upload.url
            items.append(TicketingApiMapper.layout_to_response(layout, image_url=image_url))
        
        return LayoutListResponse(items=items)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{layout_id}", response_model=LayoutResponse)
async def get_layout(
    layout_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository),
):
    """Retrieve a layout by identifier"""

    try:
        set_tenant_context(current_user.tenant_id)
        layout = await mediator.query(GetLayoutByIdQuery(layout_id=layout_id))
        
        # Fetch file URL if file_id exists
        image_url = None
        if layout.file_id:
            file_upload = await file_upload_repo.get_by_id(layout.file_id)
            if file_upload:
                image_url = file_upload.url
        
        return TicketingApiMapper.layout_to_response(layout, image_url=image_url)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{layout_id}/with-seats", response_model=LayoutWithSeatsResponse)
async def get_layout_with_seats(
    layout_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository),
):
    """Retrieve a layout with all its seats in one request"""

    try:
        set_tenant_context(current_user.tenant_id)
        layout, seats = await mediator.query(
            GetLayoutWithSeatsQuery(layout_id=layout_id)
        )
        
        # Fetch file URL if file_id exists
        image_url = None
        if layout.file_id:
            file_upload = await file_upload_repo.get_by_id(layout.file_id)
            if file_upload:
                image_url = file_upload.url
        
        layout_response = TicketingApiMapper.layout_to_response(layout, image_url=image_url)
        
        # Fetch all sections for this layout
        from app.infrastructure.shared.database.models import SectionModel
        from app.infrastructure.shared.database.connection import get_session_sync
        from sqlmodel import select
        from app.presentation.api.ticketing.schemas_layout import SectionResponse
        
        section_responses = []
        section_map = {}
        with get_session_sync() as session:
            # Fetch all sections for this layout
            statement = select(SectionModel).where(
                SectionModel.layout_id == layout_id,
                SectionModel.is_deleted == False
            )
            sections = session.exec(statement).all()
            
            # Build section map for seat responses
            section_map = {section.id: section.name for section in sections}
            
            # Build section responses
            for section in sections:
                section_image_url = None
                if section.file_id:
                    section_file_upload = await file_upload_repo.get_by_id(section.file_id)
                    if section_file_upload:
                        section_image_url = section_file_upload.url
                
                section_responses.append(SectionResponse(
                    id=section.id,
                    tenant_id=section.tenant_id,
                    layout_id=section.layout_id,
                    name=section.name,
                    x_coordinate=section.x_coordinate,
                    y_coordinate=section.y_coordinate,
                    file_id=section.file_id,
                    image_url=section_image_url,
                    is_active=section.is_active,
                    created_at=section.created_at,
                    updated_at=section.updated_at,
                ))
        
        seat_responses = []
        for seat in seats:
            seat_response = TicketingApiMapper.seat_to_response(seat)
            seat_response.section_name = section_map.get(seat.section_id, "Unknown")
            seat_responses.append(seat_response)
        
        return LayoutWithSeatsResponse(
            layout=layout_response,
            seats=seat_responses,
            sections=section_responses,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{layout_id}", response_model=LayoutResponse)
async def update_layout(
    layout_id: str,
    request: LayoutUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository),
):
    """Update layout fields"""

    try:
        set_tenant_context(current_user.tenant_id)
        command = UpdateLayoutCommand(
            layout_id=layout_id,
            name=request.name,
            description=request.description,
            file_id=request.file_id,
        )
        layout = await mediator.send(command)
        
        # Fetch file URL if file_id exists
        image_url = None
        if layout.file_id:
            file_upload = await file_upload_repo.get_by_id(layout.file_id)
            if file_upload:
                image_url = file_upload.url
        
        return TicketingApiMapper.layout_to_response(layout, image_url=image_url)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{layout_id}", status_code=204)
async def delete_layout(
    layout_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a layout (soft-delete by default)"""

    try:
        await mediator.send(DeleteLayoutCommand(layout_id=layout_id))
        from fastapi import Response
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
