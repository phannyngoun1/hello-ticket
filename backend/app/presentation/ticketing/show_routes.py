"""FastAPI routes for Ticketing shows"""
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.ticketing.commands_show import (
    CreateShowCommand,
    UpdateShowCommand,
    DeleteShowCommand,
    ShowImageCommandData,
)
from app.application.ticketing.queries_show import (
    GetShowByIdQuery,
    SearchShowsQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.domain.shared.file_upload_repository import FileUploadRepository
from app.presentation.api.ticketing.schemas_show import (
    ShowCreateRequest,
    ShowListResponse,
    ShowResponse,
    ShowUpdateRequest,
    ShowImageCreateRequest,
    ShowImageUpdateRequest,
    ShowImageResponse,
)
from app.presentation.api.ticketing.mapper_show import TicketingApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.core.routes.upload_routes import get_file_upload_repository
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import set_tenant_context
from app.infrastructure.shared.database.models import ShowModel, ShowImageModel
from app.infrastructure.shared.database.connection import get_session_sync
from sqlmodel import select
from app.shared.utils import generate_id
from datetime import datetime, timezone

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.MANAGE_TICKETING_SHOW
VIEW_PERMISSION = Permission.VIEW_TICKETING_SHOW

router = APIRouter(prefix="/ticketing/shows", tags=["ticketing"])


@router.post("", response_model=ShowResponse, status_code=201)
async def create_show(
    request: ShowCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new show"""

    try:
        # Convert image data from request to command format
        images = None
        if request.images:
            images = [
                ShowImageCommandData(
                    file_id=img.file_id,
                    name=img.name,
                    description=img.description,
                    is_banner=img.is_banner,
                )
                for img in request.images
            ]
        
        command = CreateShowCommand(
            code=request.code,
            name=request.name,
            organizer_id=request.organizer_id,
            started_date=request.started_date,
            ended_date=request.ended_date,
            note=request.note,
            images=images,
        )
        show = await mediator.send(command)
        return TicketingApiMapper.show_to_response(show)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=ShowListResponse)
async def list_shows(
    search: Optional[str] = Query(None, description="Search term for show code or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search shows with optional filters"""

    try:
        result = await mediator.query(
            SearchShowsQuery(
                search=search,
                is_active=is_active,
                skip=skip,
                limit=limit,
            )
        )
        items = [TicketingApiMapper.show_to_response(show) for show in result.items]
        return ShowListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


def show_image_model_to_response(
    image: ShowImageModel, 
    file_url: Optional[str] = None
) -> ShowImageResponse:
    """Convert ShowImageModel to ShowImageResponse"""
    return ShowImageResponse(
        id=image.id,
        show_id=image.show_id,
        tenant_id=image.tenant_id,
        file_id=image.file_id,
        file_url=file_url,
        name=image.name,
        description=image.description,
        is_banner=image.is_banner,
        created_at=image.created_at,
        updated_at=image.updated_at,
    )


@router.get("/{show_id}/images", response_model=List[ShowImageResponse])
async def list_show_images(
    show_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository),
):
    """Get all images for a show"""
    try:
        set_tenant_context(current_user.tenant_id)
        
        with get_session_sync() as session:
            # Verify show exists and belongs to tenant
            show_statement = select(ShowModel).where(
                ShowModel.id == show_id,
                ShowModel.tenant_id == current_user.tenant_id,
                ShowModel.is_deleted == False
            )
            show = session.exec(show_statement).first()
            if not show:
                raise NotFoundError(f"Show with id '{show_id}' not found")
            
            # Fetch all images for the show
            image_statement = select(ShowImageModel).where(
                ShowImageModel.show_id == show_id,
                ShowImageModel.tenant_id == current_user.tenant_id
            )
            images = session.exec(image_statement).all()
            
            # Fetch file URLs for all images
            items = []
            for image in images:
                file_url = None
                if image.file_id:
                    file_upload = await file_upload_repo.get_by_id(image.file_id)
                    if file_upload:
                        file_url = file_upload.url
                items.append(show_image_model_to_response(image, file_url))
            
            return items
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/{show_id}/images", response_model=ShowImageResponse, status_code=201)
async def create_show_image(
    show_id: str,
    request: ShowImageCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository),
):
    """Create a new show image"""
    try:
        set_tenant_context(current_user.tenant_id)
        
        with get_session_sync() as session:
            # Verify show exists and belongs to tenant
            show_statement = select(ShowModel).where(
                ShowModel.id == show_id,
                ShowModel.tenant_id == current_user.tenant_id,
                ShowModel.is_deleted == False
            )
            show = session.exec(show_statement).first()
            if not show:
                raise NotFoundError(f"Show with id '{show_id}' not found")
            
            # Verify file exists
            file_upload = await file_upload_repo.get_by_id(request.file_id)
            if not file_upload:
                raise NotFoundError(f"File with id '{request.file_id}' not found")
            
            # If setting as banner, unset all other banners for this show
            if request.is_banner:
                banner_statement = select(ShowImageModel).where(
                    ShowImageModel.show_id == show_id,
                    ShowImageModel.tenant_id == current_user.tenant_id,
                    ShowImageModel.is_banner == True
                )
                existing_banners = session.exec(banner_statement).all()
                for banner in existing_banners:
                    banner.is_banner = False
                    banner.updated_at = datetime.now(timezone.utc)
            
            # Create new show image
            image = ShowImageModel(
                id=generate_id(),
                show_id=show_id,
                tenant_id=current_user.tenant_id,
                file_id=request.file_id,
                name=request.name,
                description=request.description,
                is_banner=request.is_banner,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(image)
            session.commit()
            session.refresh(image)
            
            return show_image_model_to_response(image, file_upload.url)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{show_id}/images/{image_id}", response_model=ShowImageResponse)
async def update_show_image(
    show_id: str,
    image_id: str,
    request: ShowImageUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    file_upload_repo: FileUploadRepository = Depends(get_file_upload_repository),
):
    """Update a show image"""
    try:
        set_tenant_context(current_user.tenant_id)
        
        with get_session_sync() as session:
            # Verify show exists and belongs to tenant
            show_statement = select(ShowModel).where(
                ShowModel.id == show_id,
                ShowModel.tenant_id == current_user.tenant_id,
                ShowModel.is_deleted == False
            )
            show = session.exec(show_statement).first()
            if not show:
                raise NotFoundError(f"Show with id '{show_id}' not found")
            
            # Find the image
            image_statement = select(ShowImageModel).where(
                ShowImageModel.id == image_id,
                ShowImageModel.show_id == show_id,
                ShowImageModel.tenant_id == current_user.tenant_id
            )
            image = session.exec(image_statement).first()
            if not image:
                raise NotFoundError(f"Show image with id '{image_id}' not found")
            
            # Handle banner logic: ensure only one banner per show
            # If setting as banner, unset all other banners for this show
            if request.is_banner is not None:
                if request.is_banner is True:
                    # Setting this image as banner - unset all other banners
                    banner_statement = select(ShowImageModel).where(
                        ShowImageModel.show_id == show_id,
                        ShowImageModel.tenant_id == current_user.tenant_id,
                        ShowImageModel.is_banner == True,
                        ShowImageModel.id != image_id
                    )
                    existing_banners = session.exec(banner_statement).all()
                    for banner in existing_banners:
                        banner.is_banner = False
                        banner.updated_at = datetime.now(timezone.utc)
                # If unsetting (is_banner is False), no need to unset others
                # Just update this image's banner status
            
            # Update image fields
            if request.name is not None:
                image.name = request.name
            if request.description is not None:
                image.description = request.description
            if request.is_banner is not None:
                image.is_banner = request.is_banner
            image.updated_at = datetime.now(timezone.utc)
            
            session.add(image)
            session.commit()
            session.refresh(image)
            
            # Fetch file URL
            file_url = None
            if image.file_id:
                file_upload = await file_upload_repo.get_by_id(image.file_id)
                if file_upload:
                    file_url = file_upload.url
            
            return show_image_model_to_response(image, file_url)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{show_id}/images/{image_id}", status_code=204)
async def delete_show_image(
    show_id: str,
    image_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
):
    """Delete a show image"""
    try:
        set_tenant_context(current_user.tenant_id)
        
        with get_session_sync() as session:
            # Verify show exists and belongs to tenant
            show_statement = select(ShowModel).where(
                ShowModel.id == show_id,
                ShowModel.tenant_id == current_user.tenant_id,
                ShowModel.is_deleted == False
            )
            show = session.exec(show_statement).first()
            if not show:
                raise NotFoundError(f"Show with id '{show_id}' not found")
            
            # Find the image
            image_statement = select(ShowImageModel).where(
                ShowImageModel.id == image_id,
                ShowImageModel.show_id == show_id,
                ShowImageModel.tenant_id == current_user.tenant_id
            )
            image = session.exec(image_statement).first()
            if not image:
                raise NotFoundError(f"Show image with id '{image_id}' not found")
            
            session.delete(image)
            session.commit()
            
            return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{show_id}", response_model=ShowResponse)
async def get_show(
    show_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a show by identifier"""

    try:
        show = await mediator.query(GetShowByIdQuery(show_id=show_id))
        return TicketingApiMapper.show_to_response(show)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{show_id}", response_model=ShowResponse)
async def update_show(
    show_id: str,
    request: ShowUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update show fields"""

    try:
        # Convert image data from request to command format
        images = None
        if request.images is not None:
            images = [
                ShowImageCommandData(
                    file_id=img.file_id,
                    name=img.name,
                    description=img.description,
                    is_banner=img.is_banner,
                )
                for img in request.images
            ]
        
        command = UpdateShowCommand(
            show_id=show_id,
            code=request.code,
            name=request.name,
            organizer_id=request.organizer_id,
            started_date=request.started_date,
            ended_date=request.ended_date,
            note=request.note,
            images=images,
        )
        show = await mediator.send(command)
        return TicketingApiMapper.show_to_response(show)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{show_id}", status_code=204)
async def delete_show(
    show_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a show (soft-delete by default)"""

    try:
        await mediator.send(DeleteShowCommand(show_id=show_id))
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))



