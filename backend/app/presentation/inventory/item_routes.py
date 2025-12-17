"""
Item Management API routes
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException

from app.application.inventory import (
    CreateItemCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    GetItemByIdQuery,
    GetAllItemsQuery,
    SearchItemsQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.inventory.mapper import ItemResponseMapper
from app.presentation.api.inventory.schemas import (
    ItemCreate,
    ItemUpdate,
    ItemResponse,
    PaginatedItemResponse,
)
from app.presentation.core.dependencies.auth_dependencies import RequirePermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.exceptions import NotFoundError, BusinessRuleError, ValidationError
from app.shared.mediator import Mediator

router = APIRouter(prefix="/inventory/items", tags=["inventory", "items"])


@router.post("", response_model=ItemResponse, status_code=201)
async def create_item(
    item_data: ItemCreate,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_PRODUCT)),  # Reuse product permission for now
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Create a new inventory item"""
    try:
        command = CreateItemCommand(
            name=item_data.name,
            code=item_data.code,
            sku=item_data.sku,
            default_uom=item_data.default_uom,
            description=item_data.description,
            item_group=item_data.item_group,
            category_id=item_data.category_id,
            item_type=item_data.item_type,
            item_usage=item_data.item_usage,
            tracking_scope=item_data.tracking_scope,
            tracking_requirements=item_data.tracking_requirements,
            perishable=item_data.perishable,
            attributes=item_data.attributes or {},
            uom_mappings=item_data.uom_mappings
        )
        item = await mediator.send(command)
        return ItemResponseMapper.to_response(item)
    except (BusinessRuleError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),  # Reuse product permission
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Get item by ID"""
    query = GetItemByIdQuery(item_id=item_id)
    item = await mediator.query(query)
    if not item:
        raise NotFoundError("Item not found")
    return ItemResponseMapper.to_response(item)


@router.get("", response_model=PaginatedItemResponse)
async def get_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(False),
    search: Optional[str] = Query(None, description="Search query (name or SKU)"),
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Get all items with pagination, optionally filtered by search"""
    if search and search.strip():
        # Use search query when search parameter is provided
        query = SearchItemsQuery(query=search.strip(), skip=skip, limit=limit, active_only=active_only)
        items = await mediator.query(query)
    else:
        # Use regular get all query when no search
        query = GetAllItemsQuery(skip=skip, limit=limit, active_only=active_only)
        items = await mediator.query(query)
    return ItemResponseMapper.to_paginated_response(items, skip=skip, limit=limit)


@router.get("/search/", response_model=PaginatedItemResponse)
async def search_items(
    q: str = Query(..., min_length=1, description="Search query (name or SKU)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(False),
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Search items by name or SKU"""
    query = SearchItemsQuery(query=q, skip=skip, limit=limit, active_only=active_only)
    items = await mediator.query(query)
    return ItemResponseMapper.to_paginated_response(items, skip=skip, limit=limit)


@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: str,
    item_data: ItemUpdate,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Update an item"""
    try:
        command = UpdateItemCommand(
            item_id=item_id,
            code=item_data.code,
            sku=item_data.sku,
            name=item_data.name,
            description=item_data.description,
            item_group=item_data.item_group,
            category_id=item_data.category_id,
            item_type=item_data.item_type,
            item_usage=item_data.item_usage,
            tracking_scope=item_data.tracking_scope,
            default_uom=item_data.default_uom,
            tracking_requirements=item_data.tracking_requirements,
            perishable=item_data.perishable,
            active=item_data.active,
            attributes=item_data.attributes,
            uom_mappings=item_data.uom_mappings
        )
        item = await mediator.send(command)
        return ItemResponseMapper.to_response(item)
    except (BusinessRuleError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{item_id}", status_code=204)
async def delete_item(
    item_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.DELETE_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Delete an item"""
    try:
        command = DeleteItemCommand(item_id=item_id)
        await mediator.send(command)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
