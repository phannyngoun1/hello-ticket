"""FastAPI routes for Ticketing event seats"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.ticketing.commands_event_seat import (
    InitializeEventSeatsCommand,
    ImportBrokerSeatsCommand,
    BrokerSeatImportItem,
)
from app.application.ticketing.queries_event_seat import (
    GetEventSeatsQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.ticketing.schemas_event_seat import (
    ImportBrokerSeatsRequest,
    EventSeatResponse,
    EventSeatListResponse,
)
from app.presentation.api.ticketing.mapper_event_seat import EventSeatApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

# Permission constants
MANAGE_PERMISSION = Permission.MANAGE_TICKETING_EVENT
VIEW_PERMISSION = Permission.VIEW_TICKETING_EVENT

router = APIRouter(prefix="/ticketing/events", tags=["ticketing"])


@router.post("/{event_id}/seats/initialize", response_model=List[EventSeatResponse], status_code=201)
async def initialize_event_seats(
    event_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Initialize event seats from the assigned layout"""
    try:
        command = InitializeEventSeatsCommand(
            event_id=event_id,
            tenant_id=current_user.tenant_id
        )
        seats = await mediator.send(command)
        return [EventSeatApiMapper.to_response(s) for s in seats]
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/{event_id}/seats/import", response_model=List[EventSeatResponse], status_code=201)
async def import_broker_seats(
    event_id: str,
    request: ImportBrokerSeatsRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Import seats from a broker list"""
    try:
        command = ImportBrokerSeatsCommand(
            event_id=event_id,
            tenant_id=current_user.tenant_id,
            broker_id=request.broker_id,
            seats=[
                BrokerSeatImportItem(
                    section_name=s.section_name,
                    row_name=s.row_name,
                    seat_number=s.seat_number,
                    price=s.price,
                    ticket_code=s.ticket_code,
                    attributes=s.attributes
                ) for s in request.seats
            ]
        )
        seats = await mediator.send(command)
        return [EventSeatApiMapper.to_response(s) for s in seats]
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{event_id}/seats", response_model=EventSeatListResponse)
async def list_event_seats(
    event_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve event seats with pagination"""
    try:
        result = await mediator.query(
            GetEventSeatsQuery(
                event_id=event_id,
                tenant_id=current_user.tenant_id,
                skip=skip,
                limit=limit
            )
        )
        items = [EventSeatApiMapper.to_response(s) for s in result.items]
        return EventSeatListResponse(
            items=items,
            total=result.total,
            skip=skip,
            limit=limit,
            has_next=result.has_next
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
