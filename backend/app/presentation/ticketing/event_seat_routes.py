"""FastAPI routes for Ticketing event seats"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.ticketing.commands_event_seat import (
    InitializeEventSeatsCommand,
    SectionPricingConfig,
    SeatPricingConfig,
    ImportBrokerSeatsCommand,
    BrokerSeatImportItem,
    DeleteEventSeatsCommand,
    CreateTicketsFromSeatsCommand,
    CreateEventSeatCommand,
    HoldEventSeatsCommand,
    BlockEventSeatsCommand,
)
from app.application.ticketing.queries_event_seat import (
    GetEventSeatsQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.ticketing.schemas_event_seat import (
    InitializeEventSeatsRequest,
    ImportBrokerSeatsRequest,
    DeleteEventSeatsRequest,
    CreateTicketsFromSeatsRequest,
    CreateEventSeatRequest,
    HoldEventSeatsRequest,
    BlockEventSeatsRequest,
    EventSeatResponse,
    EventSeatListResponse,
)
from app.presentation.api.ticketing.mapper_event_seat import EventSeatApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.container import container
from app.domain.ticketing.ticket_repositories import TicketRepository
from app.shared.tenant_context import set_tenant_context

# Permission constants
MANAGE_PERMISSION = Permission.MANAGE_TICKETING_EVENT
VIEW_PERMISSION = Permission.VIEW_TICKETING_EVENT

router = APIRouter(prefix="/ticketing/events", tags=["ticketing"])


@router.post("/{event_id}/seats/initialize", response_model=List[EventSeatResponse], status_code=201)
async def initialize_event_seats(
    event_id: str,
    request: InitializeEventSeatsRequest = InitializeEventSeatsRequest(),
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Initialize event seats from the assigned layout"""
    try:
        # Convert section pricing config from schema to command
        section_pricing = None
        if request.section_pricing:
            section_pricing = [
                SectionPricingConfig(section_id=sp.section_id, price=sp.price)
                for sp in request.section_pricing
            ]
        
        # Convert seat pricing config from schema to command
        seat_pricing = None
        if request.seat_pricing:
            seat_pricing = [
                SeatPricingConfig(seat_id=sp.seat_id, price=sp.price)
                for sp in request.seat_pricing
            ]
        
        command = InitializeEventSeatsCommand(
            event_id=event_id,
            tenant_id=current_user.tenant_id,
            generate_tickets=request.generate_tickets,
            ticket_price=request.ticket_price,
            pricing_mode=request.pricing_mode,
            section_pricing=section_pricing,
            seat_pricing=seat_pricing,
            included_section_ids=request.included_section_ids,
            excluded_section_ids=request.excluded_section_ids
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


@router.post("/{event_id}/seats/delete", status_code=204)
async def delete_event_seats(
    event_id: str,
    request: DeleteEventSeatsRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete specific event seats by their IDs"""
    try:
        command = DeleteEventSeatsCommand(
            event_id=event_id,
            tenant_id=current_user.tenant_id,
            event_seat_ids=request.seat_ids,
        )
        await mediator.send(command)
        return Response(status_code=204)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/{event_id}/seats/create-tickets", response_model=List[EventSeatResponse], status_code=201)
async def create_tickets_from_seats(
    event_id: str,
    request: CreateTicketsFromSeatsRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create tickets from event seats (generate ticket codes and mark as sold)"""
    try:
        command = CreateTicketsFromSeatsCommand(
            event_id=event_id,
            tenant_id=current_user.tenant_id,
            event_seat_ids=request.seat_ids,
            ticket_price=request.ticket_price,
        )
        seats = await mediator.send(command)
        return [EventSeatApiMapper.to_response(s) for s in seats]
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/{event_id}/seats", response_model=EventSeatResponse, status_code=201)
async def create_event_seat(
    event_id: str,
    request: CreateEventSeatRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a single event seat, optionally creating a ticket immediately"""
    try:
        command = CreateEventSeatCommand(
            event_id=event_id,
            tenant_id=current_user.tenant_id,
            seat_id=request.seat_id,
            section_name=request.section_name,
            row_name=request.row_name,
            seat_number=request.seat_number,
            broker_id=request.broker_id,
            create_ticket=request.create_ticket,
            ticket_price=request.ticket_price,
            ticket_number=request.ticket_number,
            attributes=request.attributes
        )
        seat = await mediator.send(command)
        return EventSeatApiMapper.to_response(seat)
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
    """Retrieve event seats with pagination, including ticket information if available"""
    try:
        # Set tenant context for repository access
        set_tenant_context(current_user.tenant_id)
        
        result = await mediator.query(
            GetEventSeatsQuery(
                event_id=event_id,
                tenant_id=current_user.tenant_id,
                skip=skip,
                limit=limit
            )
        )
        
        # Fetch tickets for all event seats
        ticket_repository: TicketRepository = container.resolve(TicketRepository)
        event_seat_ids = [seat.id for seat in result.items]
        
        # Create a map of event_seat_id -> ticket
        ticket_map = {}
        for seat_id in event_seat_ids:
            ticket = await ticket_repository.get_by_event_seat(current_user.tenant_id, seat_id)
            if ticket:
                ticket_map[seat_id] = ticket
        
        # Map seats to responses with ticket information
        items = []
        for seat in result.items:
            ticket = ticket_map.get(seat.id)
            items.append(EventSeatApiMapper.to_response(
                seat,
                ticket_number=ticket.ticket_number if ticket else None,
                ticket_price=ticket.price if ticket else None,
                ticket_status=ticket.status.value if ticket else None
            ))
        
        return EventSeatListResponse(
            items=items,
            total=result.total,
            skip=skip,
            limit=limit,
            has_next=result.has_next
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/{event_id}/seats/hold", response_model=List[EventSeatResponse])
async def hold_event_seats(
    event_id: str,
    request: HoldEventSeatsRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Hold multiple event seats with a reason"""
    try:
        command = HoldEventSeatsCommand(
            event_id=event_id,
            tenant_id=current_user.tenant_id,
            event_seat_ids=request.seat_ids,
            reason=request.reason
        )
        seats = await mediator.send(command)
        return [EventSeatApiMapper.to_response(s) for s in seats]
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/{event_id}/seats/block", response_model=List[EventSeatResponse])
async def block_event_seats(
    event_id: str,
    request: BlockEventSeatsRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Block multiple event seats with a reason"""
    try:
        command = BlockEventSeatsCommand(
            event_id=event_id,
            tenant_id=current_user.tenant_id,
            event_seat_ids=request.seat_ids,
            reason=request.reason
        )
        seats = await mediator.send(command)
        return [EventSeatApiMapper.to_response(s) for s in seats]
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
