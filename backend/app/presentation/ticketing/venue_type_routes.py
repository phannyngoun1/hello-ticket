"""FastAPI routes for Ticketing venue_types"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.ticketing.commands_venue_type import (
    CreateVenueTypeCommand,
    UpdateVenueTypeCommand,
    DeleteVenueTypeCommand,

)
from app.application.ticketing.queries_venue_type import (
    GetVenueTypeByIdQuery,
    SearchVenueTypesQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.ticketing.schemas_venue_type import (
    VenueTypeCreateRequest,
    VenueTypeListResponse,
    VenueTypeResponse,
    VenueTypeUpdateRequest,
)
from app.presentation.api.ticketing.mapper_venue_type import TicketingApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.MANAGE_TICKETING_VENUE_TYPE
VIEW_PERMISSION = Permission.VIEW_TICKETING_VENUE_TYPE

router = APIRouter(prefix="/ticketing/venue-types", tags=["ticketing"])


@router.post("", response_model=VenueTypeResponse, status_code=201)
async def create_venue_type(
    request: VenueTypeCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new venue_type"""

    try:
        command = CreateVenueTypeCommand(
            code=request.code,
            name=request.name,

        )
        venue_type = await mediator.send(command)
        return TicketingApiMapper.venue_type_to_response(venue_type)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=VenueTypeListResponse)
async def list_venue_types(
    search: Optional[str] = Query(None, description="Search term for venue_type code or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search venue_types with optional filters"""

    try:
        result = await mediator.query(
            SearchVenueTypesQuery(
                search=search,
                is_active=is_active,
                skip=skip,
                limit=limit,
            )
        )
        items = [TicketingApiMapper.venue_type_to_response(venue_type) for venue_type in result.items]
        return VenueTypeListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{venue_type_id}", response_model=VenueTypeResponse)
async def get_venue_type(
    venue_type_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a venue_type by identifier"""

    try:
        venue_type = await mediator.query(GetVenueTypeByIdQuery(venue_type_id=venue_type_id))
        return TicketingApiMapper.venue_type_to_response(venue_type)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{venue_type_id}", response_model=VenueTypeResponse)
async def update_venue_type(
    venue_type_id: str,
    request: VenueTypeUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update venue_type fields"""

    try:
        command = UpdateVenueTypeCommand(
            venue_type_id=venue_type_id,
            code=request.code,
            name=request.name,

        )
        venue_type = await mediator.send(command)
        return TicketingApiMapper.venue_type_to_response(venue_type)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{venue_type_id}", status_code=204)
async def delete_venue_type(
    venue_type_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a venue_type (soft-delete by default)"""

    try:
        await mediator.send(DeleteVenueTypeCommand(venue_type_id=venue_type_id))
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))



