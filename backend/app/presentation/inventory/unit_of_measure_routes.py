"""
Unit of Measure API routes
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException

from app.application.inventory import (
    CreateUnitOfMeasureCommand,
    UpdateUnitOfMeasureCommand,
    DeleteUnitOfMeasureCommand,
    GetUnitOfMeasureByIdQuery,
    GetAllUnitsOfMeasureQuery,
    SearchUnitsOfMeasureQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.inventory.schemas import (
    UnitOfMeasureCreate,
    UnitOfMeasureUpdate,
    UnitOfMeasureResponse,
    PaginatedUnitOfMeasureResponse,
)
from app.presentation.core.dependencies.auth_dependencies import RequirePermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.exceptions import NotFoundError, BusinessRuleError, ValidationError
from app.shared.mediator import Mediator

router = APIRouter(prefix="/inventory/units-of-measure", tags=["inventory", "units-of-measure"])


@router.post("/", response_model=UnitOfMeasureResponse, status_code=201)
async def create_unit_of_measure(
    uom_data: UnitOfMeasureCreate,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Create a new unit of measure"""
    try:
        command = CreateUnitOfMeasureCommand(
            code=uom_data.code,
            name=uom_data.name,
            base_uom=uom_data.base_uom,
            conversion_factor=uom_data.conversion_factor
        )
        result = await mediator.send(command)
        return UnitOfMeasureResponse(**result)
    except (BusinessRuleError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search", response_model=PaginatedUnitOfMeasureResponse)
async def search_units_of_measure(
    q: str = Query(..., min_length=1, description="Search query (code or name)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Search units of measure by code or name"""
    query = SearchUnitsOfMeasureQuery(query=q, skip=skip, limit=limit)
    results = await mediator.query(query)
    items = [UnitOfMeasureResponse(**r) for r in results]
    return PaginatedUnitOfMeasureResponse(
        items=items,
        skip=skip,
        limit=limit,
        has_next=len(items) == limit
    )


@router.get("/", response_model=PaginatedUnitOfMeasureResponse)
async def get_units_of_measure(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    base_uom: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Get all units of measure with pagination"""
    query = GetAllUnitsOfMeasureQuery(skip=skip, limit=limit, base_uom=base_uom)
    results = await mediator.query(query)
    items = [UnitOfMeasureResponse(**r) for r in results]
    return PaginatedUnitOfMeasureResponse(
        items=items,
        skip=skip,
        limit=limit,
        has_next=len(items) == limit
    )


@router.get("/{uom_id}", response_model=UnitOfMeasureResponse)
async def get_unit_of_measure(
    uom_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Get unit of measure by ID"""
    query = GetUnitOfMeasureByIdQuery(uom_id=uom_id)
    result = await mediator.query(query)
    if not result:
        raise HTTPException(status_code=404, detail="Unit of measure not found")
    return UnitOfMeasureResponse(**result)


@router.put("/{uom_id}", response_model=UnitOfMeasureResponse)
async def update_unit_of_measure(
    uom_id: str,
    uom_data: UnitOfMeasureUpdate,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Update a unit of measure"""
    try:
        command = UpdateUnitOfMeasureCommand(
            uom_id=uom_id,
            code=uom_data.code,
            name=uom_data.name,
            base_uom=uom_data.base_uom,
            conversion_factor=uom_data.conversion_factor
        )
        result = await mediator.send(command)
        return UnitOfMeasureResponse(**result)
    except (BusinessRuleError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{uom_id}", status_code=204)
async def delete_unit_of_measure(
    uom_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.DELETE_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Delete a unit of measure"""
    try:
        command = DeleteUnitOfMeasureCommand(uom_id=uom_id)
        await mediator.send(command)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except BusinessRuleError as e:
        raise HTTPException(status_code=400, detail=str(e))
