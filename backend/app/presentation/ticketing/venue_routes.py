"""FastAPI routes for Ticketing venues"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.ticketing.commands_venue import (
    CreateVenueCommand,
    UpdateVenueCommand,
    DeleteVenueCommand,

)
from app.application.ticketing.queries_venue import (
    GetVenueByIdQuery,
    SearchVenuesQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.ticketing.schemas_venue import (
    VenueCreateRequest,
    VenueListResponse,
    VenueResponse,
    VenueUpdateRequest,
)
from app.presentation.api.ticketing.mapper_venue import TicketingApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.MANAGE_TICKETING_VENUE
VIEW_PERMISSION = Permission.VIEW_TICKETING_VENUE

router = APIRouter(prefix="/ticketing/venues", tags=["ticketing"])


@router.post("", response_model=VenueResponse, status_code=201)
async def create_venue(
    request: VenueCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new venue"""

    try:
        command = CreateVenueCommand(
            code=request.code,
            name=request.name,
            description=request.description,
            image_url=request.image_url,
            venue_type=request.venue_type,
            capacity=request.capacity,
            parking_info=request.parking_info,
            accessibility=request.accessibility,
            amenities=request.amenities,
            opening_hours=request.opening_hours,
            phone=request.phone,
            email=request.email,
            website=request.website,
            street_address=request.street_address,
            city=request.city,
            state_province=request.state_province,
            postal_code=request.postal_code,
            country=request.country,
        )
        venue = await mediator.send(command)
        return TicketingApiMapper.venue_to_response(venue)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=VenueListResponse)
async def list_venues(
    search: Optional[str] = Query(None, description="Search term for venue code or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search venues with optional filters"""

    try:
        result = await mediator.query(
            SearchVenuesQuery(
                search=search,
                is_active=is_active,
                skip=skip,
                limit=limit,
            )
        )
        items = [TicketingApiMapper.venue_to_response(venue) for venue in result.items]
        return VenueListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{venue_id}", response_model=VenueResponse)
async def get_venue(
    venue_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a venue by identifier"""

    try:
        venue = await mediator.query(GetVenueByIdQuery(venue_id=venue_id))
        return TicketingApiMapper.venue_to_response(venue)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{venue_id}", response_model=VenueResponse)
async def update_venue(
    venue_id: str,
    request: VenueUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update venue fields"""

    try:
        command = UpdateVenueCommand(
            venue_id=venue_id,
            code=request.code,
            name=request.name,
            description=request.description,
            image_url=request.image_url,
            venue_type=request.venue_type,
            capacity=request.capacity,
            parking_info=request.parking_info,
            accessibility=request.accessibility,
            amenities=request.amenities,
            opening_hours=request.opening_hours,
            phone=request.phone,
            email=request.email,
            website=request.website,
            street_address=request.street_address,
            city=request.city,
            state_province=request.state_province,
            postal_code=request.postal_code,
            country=request.country,
        )
        venue = await mediator.send(command)
        return TicketingApiMapper.venue_to_response(venue)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{venue_id}", status_code=204)
async def delete_venue(
    venue_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a venue (soft-delete by default)"""

    try:
        await mediator.send(DeleteVenueCommand(venue_id=venue_id))
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))



