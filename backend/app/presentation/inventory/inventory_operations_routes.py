"""
Inventory Operations API routes (Receive, Issue, Adjust, Move, Reserve)
"""
from fastapi import APIRouter, Depends, HTTPException

from app.application.inventory import (
    ReceiveInventoryCommand,
    IssueInventoryCommand,
    AdjustInventoryCommand,
    MoveInventoryCommand,
    ReserveInventoryCommand,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.inventory.schemas import (
    ReceiveInventoryRequest,
    IssueInventoryRequest,
    AdjustInventoryRequest,
    MoveInventoryRequest,
    ReserveInventoryRequest,
    InventoryOperationResponse,
)
from app.presentation.core.dependencies.auth_dependencies import RequirePermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.exceptions import NotFoundError, BusinessRuleError, ValidationError
from app.shared.mediator import Mediator

router = APIRouter(prefix="/inventory/operations", tags=["inventory", "operations"])


@router.post("/receive/", response_model=InventoryOperationResponse, status_code=201)
async def receive_inventory(
    request: ReceiveInventoryRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Receive inventory"""
    try:
        command = ReceiveInventoryCommand(
            item_id=request.item_id,
            location_id=request.location_id,
            quantity=request.quantity,
            cost_per_unit=request.cost_per_unit,
            expiration_date=request.expiration_date,
            serial_numbers=request.serial_numbers,
            source_ref_type=request.source_ref_type,
            source_ref_id=request.source_ref_id,
            idempotency_key=request.idempotency_key
        )
        result = await mediator.send(command)
        return InventoryOperationResponse(
            transaction_id=result["transaction_id"],
            balance_id=result.get("balance_id"),
            quantity=result["quantity"]
        )
    except (BusinessRuleError, ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/issue/", response_model=InventoryOperationResponse, status_code=201)
async def issue_inventory(
    request: IssueInventoryRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Issue inventory"""
    try:
        command = IssueInventoryCommand(
            item_id=request.item_id,
            location_id=request.location_id,
            quantity=request.quantity,
            serial_numbers=request.serial_numbers,
            source_ref_type=request.source_ref_type,
            source_ref_id=request.source_ref_id,
            reason_code=request.reason_code,
            idempotency_key=request.idempotency_key
        )
        result = await mediator.send(command)
        return InventoryOperationResponse(
            transaction_id=result["transaction_id"],
            balance_id=result.get("balance_id"),
            quantity=result["quantity"]
        )
    except (BusinessRuleError, ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/adjust/", response_model=InventoryOperationResponse, status_code=201)
async def adjust_inventory(
    request: AdjustInventoryRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Adjust inventory quantity"""
    try:
        command = AdjustInventoryCommand(
            item_id=request.item_id,
            location_id=request.location_id,
            quantity=request.quantity,
            adjustment_type=request.adjustment_type,
            reason_code=request.reason_code,
            idempotency_key=request.idempotency_key
        )
        result = await mediator.send(command)
        return InventoryOperationResponse(
            transaction_id=result["transaction_id"],
            balance_id=result.get("balance_id"),
            quantity=result["quantity"]
        )
    except (BusinessRuleError, ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/move/", response_model=InventoryOperationResponse, status_code=201)
async def move_inventory(
    request: MoveInventoryRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Move inventory between locations"""
    try:
        command = MoveInventoryCommand(
            item_id=request.item_id,
            from_location_id=request.from_location_id,
            to_location_id=request.to_location_id,
            quantity=request.quantity,
            serial_numbers=request.serial_numbers,
            idempotency_key=request.idempotency_key
        )
        result = await mediator.send(command)
        return InventoryOperationResponse(
            transaction_id=result["transaction_id"],
            balance_id=result.get("to_balance_id"),
            quantity=result["quantity"]
        )
    except (BusinessRuleError, ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reserve/", response_model=InventoryOperationResponse, status_code=201)
async def reserve_inventory(
    request: ReserveInventoryRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Reserve inventory"""
    try:
        command = ReserveInventoryCommand(
            item_id=request.item_id,
            location_id=request.location_id,
            quantity=request.quantity,
            source_type=request.source_type,
            source_id=request.source_id,
            serial_numbers=request.serial_numbers
        )
        result = await mediator.send(command)
        return InventoryOperationResponse(
            transaction_id=result.get("reservation_id", ""),
            quantity=result["quantity"],
            status=result.get("status", "reserved")
        )
    except (BusinessRuleError, ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=400, detail=str(e))
