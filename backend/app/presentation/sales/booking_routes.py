"""FastAPI routes for Sales bookings"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.sales.commands_booking import (
    CreateBookingCommand,
    UpdateBookingCommand,
    DeleteBookingCommand,

)
from app.application.sales.queries_booking import (
    GetBookingByIdQuery,
    SearchBookingsQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.sales.schemas_booking import (
    BookingCreateRequest,
    BookingListResponse,
    BookingResponse,
    BookingUpdateRequest,
)
from app.presentation.api.sales.mapper_booking import SalesApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.MANAGE_SALES_BOOKING
VIEW_PERMISSION = Permission.VIEW_SALES_BOOKING

router = APIRouter(prefix="/sales/bookings", tags=["sales"])


@router.post("", response_model=BookingResponse, status_code=201)
async def create_booking(
    request: BookingCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new booking"""

    try:
        # Convert request items to command items
        from app.application.sales.commands_booking import BookingItemCommand
        items = [
            BookingItemCommand(
                event_seat_id=item.event_seat_id,
                section_name=item.section_name,
                row_name=item.row_name,
                seat_number=item.seat_number,
                unit_price=item.unit_price,
                total_price=item.total_price,
                currency=item.currency,
                ticket_number=item.ticket_number,
                ticket_status=item.ticket_status,
            )
            for item in request.items
        ]
        
        command = CreateBookingCommand(
            event_id=request.event_id,
            items=items,
            customer_id=request.customer_id,
            discount_type=request.discount_type,
            discount_value=request.discount_value,
            tax_rate=request.tax_rate,
            currency=request.currency,
        )
        booking = await mediator.send(command)
        return SalesApiMapper.booking_to_response(booking)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=BookingListResponse)
async def list_bookings(
    search: Optional[str] = Query(None, description="Search term for booking number"),
    status: Optional[str] = Query(None, description="Filter by booking status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search bookings with optional filters"""

    try:
        result = await mediator.query(
            SearchBookingsQuery(
                search=search,
                status=status,
                skip=skip,
                limit=limit,
            )
        )
        items = [SalesApiMapper.booking_to_response(booking) for booking in result.items]
        return BookingListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a booking by identifier"""

    try:
        booking = await mediator.query(GetBookingByIdQuery(booking_id=booking_id))
        return SalesApiMapper.booking_to_response(booking)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: str,
    request: BookingUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update booking fields"""

    try:
        command = UpdateBookingCommand(
            booking_id=booking_id,
            customer_id=request.customer_id,
            status=request.status,
            discount_type=request.discount_type,
            discount_value=request.discount_value,
            payment_status=request.payment_status,
        )
        booking = await mediator.send(command)
        return SalesApiMapper.booking_to_response(booking)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{booking_id}", status_code=204)
async def delete_booking(
    booking_id: str,
    cancellation_reason: str = Query(..., description="Reason for cancellation (required)"),
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Cancel a booking (soft-delete by default)"""

    try:
        if not cancellation_reason or not cancellation_reason.strip():
            raise HTTPException(status_code=400, detail="Cancellation reason is required")
        await mediator.send(DeleteBookingCommand(booking_id=booking_id, cancellation_reason=cancellation_reason.strip()))
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))



