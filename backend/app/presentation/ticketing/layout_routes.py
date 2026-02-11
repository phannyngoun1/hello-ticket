"""FastAPI routes for Ticketing layouts"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

logger = logging.getLogger(__name__)

from app.application.ticketing.commands_layout import (
    CreateLayoutCommand,
    UpdateLayoutCommand,
    DeleteLayoutCommand,
    CloneLayoutCommand,
    BulkDesignerSaveCommand,
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
    BulkDesignerSaveRequest,
    BulkDesignerSaveResponse,
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
            canvas_background_color=request.canvas_background_color,  # Preserve None - let frontend decide
            marker_fill_transparency=request.marker_fill_transparency,  # Preserve None - let frontend decide
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


@router.post("/{layout_id}/clone", response_model=LayoutResponse, status_code=201)
async def clone_layout(
    layout_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository),
):
    """Clone a layout with all its sections and seats."""

    try:
        set_tenant_context(current_user.tenant_id)
        layout = await mediator.send(CloneLayoutCommand(layout_id=layout_id))

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
        from app.presentation.ticketing.section_routes import section_model_to_response
        
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
            
            # Get seat counts for all sections
            from app.infrastructure.shared.database.models import SeatModel
            from sqlmodel import func
            section_ids = [s.id for s in sections]
            seat_counts = {}
            if section_ids:
                seat_count_statement = select(
                    SeatModel.section_id,
                    func.count(SeatModel.id).label("count")
                ).where(
                    SeatModel.section_id.in_(section_ids),
                    SeatModel.tenant_id == current_user.tenant_id,
                    SeatModel.is_deleted == False
                ).group_by(SeatModel.section_id)
                seat_count_results = session.exec(seat_count_statement).all()
                # Access result as tuple: (section_id, count)
                seat_counts = {row[0]: row[1] for row in seat_count_results}
            
            # Build section responses using the helper function to properly convert shape
            for section in sections:
                section_image_url = None
                if section.file_id:
                    section_file_upload = await file_upload_repo.get_by_id(section.file_id)
                    if section_file_upload:
                        section_image_url = section_file_upload.url
                
                seat_count = seat_counts.get(section.id, 0)
                section_responses.append(section_model_to_response(section, section_image_url, seat_count))
        
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
            canvas_background_color=request.canvas_background_color,
            marker_fill_transparency=request.marker_fill_transparency,
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


@router.post("/{layout_id}/bulk-save", response_model=BulkDesignerSaveResponse)
async def bulk_designer_save(
    layout_id: str,
    venue_id: str = Query(..., description="Venue ID"),
    request: BulkDesignerSaveRequest = ...,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository),
):
    """Bulk save designer changes: layout properties, sections, and seats in one operation"""
    try:
        set_tenant_context(current_user.tenant_id)
        
        # 1. Update layout properties
        # Debug: Log the transparency value being received
        logger.info("Bulk save received marker_fill_transparency: %s (type: %s)", 
                   request.marker_fill_transparency, 
                   type(request.marker_fill_transparency).__name__)
        
        layout_update_command = UpdateLayoutCommand(
            layout_id=layout_id,
            canvas_background_color=request.canvas_background_color,
            marker_fill_transparency=request.marker_fill_transparency,
            file_id=request.file_id,
        )
        layout = await mediator.send(layout_update_command)
        
        # Debug: Log the saved transparency value
        logger.info("Layout saved with marker_fill_transparency: %s", layout.marker_fill_transparency)
        
        # 2. Process section operations
        from app.infrastructure.shared.database.models import SectionModel
        from app.infrastructure.shared.database.connection import get_session_sync
        from sqlmodel import select
        from app.shared.utils import generate_id
        from datetime import datetime, timezone
        import json
        
        saved_sections = []
        with get_session_sync() as session:
            # Get all existing sections for this layout
            statement = select(SectionModel).where(
                SectionModel.tenant_id == current_user.tenant_id,
                SectionModel.layout_id == layout_id,
                SectionModel.is_deleted == False
            )
            existing_sections = {s.id: s for s in session.exec(statement).all()}
            
            # Process deletions first
            for section_op in request.sections:
                section_id = section_op.get("id")
                if section_op.get("delete") and section_id:
                    if section_id in existing_sections:
                        section = existing_sections[section_id]
                        section.is_deleted = True
                        section.updated_at = datetime.now(timezone.utc)
                        session.add(section)
            
            # Process creates and updates
            for section_op in request.sections:
                if section_op.get("delete"):
                    continue  # Already handled
                
                section_id = section_op.get("id")
                
                # Parse shape if provided
                shape_data = None
                if section_op.get("shape"):
                    shape_val = section_op["shape"]
                    if isinstance(shape_val, str):
                        try:
                            shape_data = json.loads(shape_val)
                        except json.JSONDecodeError:
                            shape_data = shape_val
                    else:
                        shape_data = shape_val
                
                if section_id and section_id in existing_sections:
                    # Update existing section
                    section = existing_sections[section_id]
                    if "name" in section_op:
                        # Check name uniqueness if changed
                        if section_op["name"] != section.name:
                            check_statement = select(SectionModel).where(
                                SectionModel.layout_id == layout_id,
                                SectionModel.name == section_op["name"],
                                SectionModel.id != section_id,
                                SectionModel.is_deleted == False
                            )
                            if session.exec(check_statement).first():
                                raise BusinessRuleError(f"Section with name '{section_op['name']}' already exists")
                        section.name = section_op["name"]
                    if "x_coordinate" in section_op:
                        section.x_coordinate = section_op["x_coordinate"]
                    if "y_coordinate" in section_op:
                        section.y_coordinate = section_op["y_coordinate"]
                    if "file_id" in section_op:
                        section.file_id = section_op["file_id"] if section_op["file_id"] else None
                    if "canvas_background_color" in section_op:
                        # Preserve None if explicitly set - allows section to inherit from layout
                        section.canvas_background_color = section_op["canvas_background_color"] if section_op["canvas_background_color"] is not None else None
                    if "marker_fill_transparency" in section_op:
                        # Preserve None if explicitly set - allows section to inherit from layout
                        section.marker_fill_transparency = section_op["marker_fill_transparency"] if section_op["marker_fill_transparency"] is not None else None
                    if shape_data is not None:
                        section.shape = shape_data
                    section.updated_at = datetime.now(timezone.utc)
                    session.add(section)
                    saved_sections.append(section)
                else:
                    # Create new section
                    if not section_op.get("name"):
                        raise ValidationError("Section name is required for creation")
                    
                    # Check name uniqueness
                    check_statement = select(SectionModel).where(
                        SectionModel.layout_id == layout_id,
                        SectionModel.name == section_op["name"],
                        SectionModel.is_deleted == False
                    )
                    if session.exec(check_statement).first():
                        raise BusinessRuleError(f"Section with name '{section_op['name']}' already exists")
                    
                    # Get values - preserve None if not provided (allows inheritance from layout)
                    canvas_bg_color = section_op.get("canvas_background_color")
                    marker_transparency = section_op.get("marker_fill_transparency")
                    
                    new_section = SectionModel(
                        id=generate_id(),
                        tenant_id=current_user.tenant_id,
                        layout_id=layout_id,
                        name=section_op["name"],
                        x_coordinate=section_op.get("x_coordinate"),
                        y_coordinate=section_op.get("y_coordinate"),
                        file_id=section_op.get("file_id"),
                        canvas_background_color=canvas_bg_color,  # Preserve None to allow inheritance from layout
                        marker_fill_transparency=marker_transparency,  # Preserve None to allow inheritance from layout
                        shape=shape_data,
                        is_active=True,
                        is_deleted=False,
                        version=0,
                        created_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc),
                    )
                    session.add(new_section)
                    saved_sections.append(new_section)
            
            session.commit()
            # Refresh all saved sections
            for section in saved_sections:
                session.refresh(section)
        
        # 3. Process seat operations using existing bulk handler
        if request.seats:
            from app.application.ticketing.commands_seat import BulkCreateSeatsCommand
            bulk_seat_command = BulkCreateSeatsCommand(
                venue_id=venue_id,
                layout_id=layout_id,
                seats=request.seats,
                file_id=None,  # Already handled in layout update
            )
            await mediator.send(bulk_seat_command)
        
        # Fetch file URL for layout
        image_url = None
        if layout.file_id:
            file_upload = await file_upload_repo.get_by_id(layout.file_id)
            if file_upload:
                image_url = file_upload.url
        
        layout_response = TicketingApiMapper.layout_to_response(layout, image_url=image_url)
        
        # Fetch ALL sections and seats for this layout (same as /with-seats endpoint)
        # Use the same query as /with-seats to ensure identical data structure
        _, all_seats = await mediator.query(
            GetLayoutWithSeatsQuery(layout_id=layout_id)
        )
        
        from app.presentation.ticketing.section_routes import section_model_to_response
        from app.infrastructure.shared.database.models import SeatModel
        from sqlmodel import func
        
        section_responses = []
        section_map = {}
        with get_session_sync() as session:
            # Fetch all sections for this layout (same as /with-seats endpoint)
            statement = select(SectionModel).where(
                SectionModel.layout_id == layout_id,
                SectionModel.tenant_id == current_user.tenant_id,
                SectionModel.is_deleted == False
            )
            all_sections = session.exec(statement).all()
            
            # Build section map for seat responses (section_id -> section_name)
            section_map = {section.id: section.name for section in all_sections}
            
            # Get seat counts for all sections
            section_ids = [s.id for s in all_sections]
            seat_counts = {}
            if section_ids:
                seat_count_statement = select(
                    SeatModel.section_id,
                    func.count(SeatModel.id).label("count")
                ).where(
                    SeatModel.section_id.in_(section_ids),
                    SeatModel.tenant_id == current_user.tenant_id,
                    SeatModel.is_deleted == False
                ).group_by(SeatModel.section_id)
                seat_count_results = session.exec(seat_count_statement).all()
                # Access result as tuple: (section_id, count)
                seat_counts = {row[0]: row[1] for row in seat_count_results}
            
            # Build section responses using the helper function (same as /with-seats endpoint)
            for section in all_sections:
                section_image_url = None
                if section.file_id:
                    section_file_upload = await file_upload_repo.get_by_id(section.file_id)
                    if section_file_upload:
                        section_image_url = section_file_upload.url
                
                seat_count = seat_counts.get(section.id, 0)
                section_responses.append(section_model_to_response(section, section_image_url, seat_count))
        
        # Convert ALL seats to responses and add section_name (same as /with-seats endpoint)
        seat_responses = []
        for seat in all_seats:
            seat_response = TicketingApiMapper.seat_to_response(seat)
            seat_response.section_name = section_map.get(seat.section_id, "Unknown")
            seat_responses.append(seat_response)
        
        return BulkDesignerSaveResponse(
            layout=layout_response,
            sections=section_responses,
            seats=seat_responses,
        )
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
