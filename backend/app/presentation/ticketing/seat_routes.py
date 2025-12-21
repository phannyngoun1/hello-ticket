"""FastAPI routes for Ticketing seats"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.ticketing.commands_seat import (
    CreateSeatCommand,
    UpdateSeatCommand,
    UpdateSeatCoordinatesCommand,
    DeleteSeatCommand,
    BulkCreateSeatsCommand,
    DeleteSeatsByVenueCommand,
)
from app.application.ticketing.queries_seat import (
    GetSeatByIdQuery,
    GetSeatsByVenueQuery,
    GetSeatsByLayoutQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.ticketing.schemas_seat import (
    SeatCreateRequest,
    SeatUpdateRequest,
    SeatUpdateCoordinatesRequest,
    SeatListResponse,
    SeatResponse,
    BulkSeatCreateRequest,
)
from app.presentation.api.ticketing.mapper_venue import TicketingApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.MANAGE_TICKETING_VENUE  # Reuse venue permission for seats
VIEW_PERMISSION = Permission.VIEW_TICKETING_VENUE

router = APIRouter(prefix="/ticketing/seats", tags=["ticketing"])


@router.post("", response_model=SeatResponse, status_code=201)
async def create_seat(
    request: SeatCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new seat"""

    try:
        command = CreateSeatCommand(
            venue_id=request.venue_id,
            layout_id=request.layout_id,
            section_id=request.section_id,
            row=request.row,
            seat_number=request.seat_number,
            seat_type=request.seat_type,
            x_coordinate=request.x_coordinate,
            y_coordinate=request.y_coordinate,
        )
        seat = await mediator.send(command)
        return TicketingApiMapper.seat_to_response(seat)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=SeatListResponse)
async def list_seats(
    venue_id: Optional[str] = Query(None, description="Filter by venue ID"),
    layout_id: Optional[str] = Query(None, description="Filter by layout ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=5000),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Get all seats for a venue or layout"""

    try:
        if not venue_id and not layout_id:
            raise ValidationError("Either venue_id or layout_id must be provided")
        
        if layout_id:
            result = await mediator.query(
                GetSeatsByLayoutQuery(
                    layout_id=layout_id,
                    skip=skip,
                    limit=limit,
                )
            )
        else:
            result = await mediator.query(
                GetSeatsByVenueQuery(
                    venue_id=venue_id,
                    skip=skip,
                    limit=limit,
                )
            )
        
        # Fetch section names for all seats
        from app.infrastructure.shared.database.models import SectionModel
        from app.infrastructure.shared.database.connection import get_session_sync
        from sqlmodel import select
        
        section_map = {}
        if result.items:
            section_ids = {seat.section_id for seat in result.items}
            with get_session_sync() as session:
                statement = select(SectionModel).where(SectionModel.id.in_(section_ids))
                sections = session.exec(statement).all()
                section_map = {section.id: section.name for section in sections}
        
        items = []
        for seat in result.items:
            seat_response = TicketingApiMapper.seat_to_response(seat)
            seat_response.section_name = section_map.get(seat.section_id, "Unknown")
            items.append(seat_response)
        
        return SeatListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{seat_id}", response_model=SeatResponse)
async def get_seat(
    seat_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a seat by identifier"""

    try:
        seat = await mediator.query(GetSeatByIdQuery(seat_id=seat_id))
        return TicketingApiMapper.seat_to_response(seat)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{seat_id}", response_model=SeatResponse)
async def update_seat(
    seat_id: str,
    request: SeatUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update seat fields"""

    try:
        command = UpdateSeatCommand(
            seat_id=seat_id,
            section_id=request.section_id,
            row=request.row,
            seat_number=request.seat_number,
            seat_type=request.seat_type,
            x_coordinate=request.x_coordinate,
            y_coordinate=request.y_coordinate,
        )
        seat = await mediator.send(command)
        return TicketingApiMapper.seat_to_response(seat)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.patch("/{seat_id}/coordinates", response_model=SeatResponse)
async def update_seat_coordinates(
    seat_id: str,
    request: SeatUpdateCoordinatesRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update seat coordinates for seat map"""

    try:
        command = UpdateSeatCoordinatesCommand(
            seat_id=seat_id,
            x_coordinate=request.x_coordinate,
            y_coordinate=request.y_coordinate,
        )
        seat = await mediator.send(command)
        return TicketingApiMapper.seat_to_response(seat)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{seat_id}", status_code=204)
async def delete_seat(
    seat_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a seat (soft-delete by default)"""

    try:
        await mediator.send(DeleteSeatCommand(seat_id=seat_id))
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post("/bulk", response_model=list[SeatResponse], status_code=201)
async def bulk_create_seats(
    venue_id: str = Query(..., description="Venue ID"),
    layout_id: Optional[str] = Query(None, description="Layout ID (required if seats array is empty or for image updates)"),
    request: BulkSeatCreateRequest = ...,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Bulk create seats for a venue. Can also update layout file_id if provided."""

    try:
        # Extract layout_id from query param or first seat
        resolved_layout_id = layout_id
        if not resolved_layout_id and request.seats and len(request.seats) > 0:
            resolved_layout_id = request.seats[0].get("layout_id")
        
        if not resolved_layout_id:
            raise ValidationError("layout_id is required (provide as query parameter or in seat data)")
        
        command = BulkCreateSeatsCommand(
            venue_id=venue_id,
            layout_id=resolved_layout_id,
            seats=request.seats,
            file_id=request.file_id,
        )
        result = await mediator.send(command)
        # Return all created and updated seats
        return [TicketingApiMapper.seat_to_response(seat) for seat in result]
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/venue/{venue_id}", status_code=200)
async def delete_seats_by_venue(
    venue_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete all seats for a venue"""

    try:
        count = await mediator.send(DeleteSeatsByVenueCommand(venue_id=venue_id))
        return {"deleted_count": count}
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
