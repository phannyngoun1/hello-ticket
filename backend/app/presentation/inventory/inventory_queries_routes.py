"""
Inventory Query API routes (Balances and Transactions)
"""
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, Query

from app.application.inventory import (
    GetInventoryBalanceQuery,
    GetAvailableQuantityQuery,
    GetBalancesByItemQuery,
    GetTransactionHistoryQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.inventory.mapper import (
    InventoryBalanceResponseMapper,
    TransactionResponseMapper,
)
from app.presentation.api.inventory.schemas import (
    InventoryBalanceResponse,
    TransactionResponse,
)
from app.presentation.core.dependencies.auth_dependencies import RequirePermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.container import container

router = APIRouter(prefix="/inventory/queries", tags=["inventory", "queries"])


@router.get("/balances/{item_id}/{location_id}", response_model=Optional[InventoryBalanceResponse])
async def get_balance(
    item_id: str,
    location_id: str,
    tracking_id: Optional[str] = Query(None),
    status: str = Query("available"),
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Get inventory balance"""
    query = GetInventoryBalanceQuery(
        item_id=item_id,
        location_id=location_id,
        tracking_id=tracking_id,
        status=status
    )
    balance = await mediator.query(query)
    if not balance:
        return None
    return InventoryBalanceResponseMapper.to_response(balance)


@router.get("/balances/{item_id}", response_model=List[InventoryBalanceResponse])
async def get_balances_by_item(
    item_id: str,
    location_id: Optional[str] = Query(None, description="StoreLocation ID"),
    status: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Get all balances for an item"""
    query = GetBalancesByItemQuery(
        item_id=item_id,
        location_id=location_id,
        status=status
    )
    balances = await mediator.query(query)
    
    # Return balances without location enrichment
    return InventoryBalanceResponseMapper.to_list_response(balances, {})


@router.get("/quantity/{item_id}/{location_id}", response_model=Decimal)
async def get_available_quantity(
    item_id: str,
    location_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Get available quantity for an item/location"""
    query = GetAvailableQuantityQuery(item_id=item_id, location_id=location_id)
    quantity = await mediator.query(query)
    return quantity


@router.get("/transactions/{item_id}", response_model=List[TransactionResponse])
async def get_transaction_history(
    item_id: str,
    location_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Get transaction history for an item"""
    query = GetTransactionHistoryQuery(
        item_id=item_id,
        location_id=location_id,
        skip=skip,
        limit=limit
    )
    transactions = await mediator.query(query)
    return TransactionResponseMapper.to_list_response(transactions)
