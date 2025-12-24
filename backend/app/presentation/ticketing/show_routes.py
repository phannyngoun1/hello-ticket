"""FastAPI routes for Ticketing shows"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.ticketing.commands_show import (
    CreateShowCommand,
    UpdateShowCommand,
    DeleteShowCommand,

)
from app.application.ticketing.queries_show import (
    GetShowByIdQuery,
    SearchShowsQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.ticketing.schemas_show import (
    ShowCreateRequest,
    ShowListResponse,
    ShowResponse,
    ShowUpdateRequest,
)
from app.presentation.api.ticketing.mapper_show import TicketingApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

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
        command = CreateShowCommand(
            code=request.code,
            name=request.name,
            organizer_id=request.organizer_id,
            started_date=request.started_date,
            ended_date=request.ended_date,
            note=request.note,
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
        command = UpdateShowCommand(
            show_id=show_id,
            code=request.code,
            name=request.name,
            organizer_id=request.organizer_id,
            started_date=request.started_date,
            ended_date=request.ended_date,
            note=request.note,
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



