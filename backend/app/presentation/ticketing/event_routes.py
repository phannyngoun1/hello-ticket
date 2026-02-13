"""FastAPI routes for Ticketing events"""
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.ticketing.commands_event import (
    CreateEventCommand,
    UpdateEventCommand,
    DeleteEventCommand,

)
from app.application.ticketing.queries_event import (
    GetEventByIdQuery,
    SearchEventsQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.ticketing.schemas_event import (
    EventCreateRequest,
    EventListResponse,
    EventResponse,
    EventUpdateRequest,
)
from app.presentation.api.ticketing.mapper_event import EventPresenter
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.MANAGE_TICKETING_EVENT
VIEW_PERMISSION = Permission.VIEW_TICKETING_EVENT

router = APIRouter(prefix="/ticketing/events", tags=["ticketing"])


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    request: EventCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new event"""

    try:
        command = CreateEventCommand(
            show_id=request.show_id,
            title=request.title,
            start_dt=request.start_dt,
            duration_minutes=request.duration_minutes,
            venue_id=request.venue_id,
            layout_id=request.layout_id,
            status=request.status,
        )
        event = await mediator.send(command)
        return EventPresenter().from_domain(event)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=EventListResponse)
async def list_events(
    search: Optional[str] = Query(None, description="Search term for event title"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    show_id: Optional[str] = Query(None, description="Filter by show ID"),
    layout_id: Optional[str] = Query(None, description="Filter by layout ID"),
    status: Optional[List[str]] = Query(None, description="Filter by event status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    sort_by: str = Query("start_dt", description="Sort field (e.g. start_dt)"),
    sort_order: str = Query("asc", description="Sort order (asc or desc)"),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search events with optional filters, sorted by start date ascending by default."""

    try:
        result = await mediator.query(
            SearchEventsQuery(
                search=search,
                is_active=is_active,
                show_id=show_id,
                layout_id=layout_id,
                status=status,
                skip=skip,
                limit=limit,
                sort_by=sort_by,
                sort_order=sort_order,
            )
        )
        presenter = EventPresenter()
        items = presenter.from_domain_list(result.items)
        return EventListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a event by identifier"""

    try:
        event = await mediator.query(GetEventByIdQuery(event_id=event_id))
        return EventPresenter().from_domain(event)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    request: EventUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update event fields"""

    try:
        command = UpdateEventCommand(
            event_id=event_id,
            title=request.title,
            start_dt=request.start_dt,
            duration_minutes=request.duration_minutes,
            venue_id=request.venue_id,
            layout_id=request.layout_id,
            status=request.status,
        )
        event = await mediator.send(command)
        return EventPresenter().from_domain(event)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a event (soft-delete by default)"""

    try:
        await mediator.send(DeleteEventCommand(event_id=event_id))
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))



