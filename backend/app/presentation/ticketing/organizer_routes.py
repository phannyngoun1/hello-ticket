"""FastAPI routes for Ticketing organizers"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.ticketing.commands_organizer import (
    CreateOrganizerCommand,
    UpdateOrganizerCommand,
    DeleteOrganizerCommand,

)
from app.application.ticketing.queries_organizer import (
    GetOrganizerByIdQuery,
    SearchOrganizersQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.ticketing.schemas_organizer import (
    OrganizerCreateRequest,
    OrganizerListResponse,
    OrganizerResponse,
    OrganizerUpdateRequest,
)
from app.presentation.api.ticketing.mapper_organizer import TicketingApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.MANAGE_TICKETING_ORGANIZER
VIEW_PERMISSION = Permission.VIEW_TICKETING_ORGANIZER

router = APIRouter(prefix="/ticketing/organizers", tags=["ticketing"])


@router.post("", response_model=OrganizerResponse, status_code=201)
async def create_organizer(
    request: OrganizerCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new organizer"""

    try:
        command = CreateOrganizerCommand(
            code=request.code,
            name=request.name,
            description=request.description,
            email=request.email,
            phone=request.phone,
            website=request.website,
            address=request.address,
            city=request.city,
            country=request.country,
            logo=request.logo,
            tags=request.tags,
        )
        organizer = await mediator.send(command)
        return TicketingApiMapper.organizer_to_response(organizer)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=OrganizerListResponse)
async def list_organizers(
    search: Optional[str] = Query(None, description="Search term for organizer code or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search organizers with optional filters"""

    try:
        result = await mediator.query(
            SearchOrganizersQuery(
                search=search,
                is_active=is_active,
                skip=skip,
                limit=limit,
            )
        )
        items = [TicketingApiMapper.organizer_to_response(organizer) for organizer in result.items]
        return OrganizerListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
            search_term=search,
            is_active_filter=is_active,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{organizer_id}", response_model=OrganizerResponse)
async def get_organizer(
    organizer_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a organizer by identifier"""

    try:
        organizer = await mediator.query(GetOrganizerByIdQuery(organizer_id=organizer_id))
        return TicketingApiMapper.organizer_to_response(organizer)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{organizer_id}", response_model=OrganizerResponse)
async def update_organizer(
    organizer_id: str,
    request: OrganizerUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update organizer fields"""

    try:
        command = UpdateOrganizerCommand(
            organizer_id=organizer_id,
            code=request.code,
            name=request.name,
            description=request.description,
            email=request.email,
            phone=request.phone,
            website=request.website,
            address=request.address,
            city=request.city,
            country=request.country,
            logo=request.logo,
            tags=request.tags,
        )
        organizer = await mediator.send(command)
        return TicketingApiMapper.organizer_to_response(organizer)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{organizer_id}", status_code=204)
async def delete_organizer(
    organizer_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a organizer (soft-delete by default)"""

    try:
        await mediator.send(DeleteOrganizerCommand(organizer_id=organizer_id))
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))



