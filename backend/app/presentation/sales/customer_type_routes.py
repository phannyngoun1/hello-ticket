"""FastAPI routes for Sales customer_types"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.sales.commands_customer_type import (
    CreateCustomerTypeCommand,
    UpdateCustomerTypeCommand,
    DeleteCustomerTypeCommand,

)
from app.application.sales.queries_customer_type import (
    GetCustomerTypeByIdQuery,
    SearchCustomerTypesQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.sales.schemas_customer_type import (
    CustomerTypeCreateRequest,
    CustomerTypeListResponse,
    CustomerTypeResponse,
    CustomerTypeUpdateRequest,
)
from app.presentation.api.sales.mapper_customer_type import SalesApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.MANAGE_SALES_CUSTOMER_TYPE
VIEW_PERMISSION = Permission.VIEW_SALES_CUSTOMER_TYPE

router = APIRouter(prefix="/sales/customer-types", tags=["sales"])


@router.post("", response_model=CustomerTypeResponse, status_code=201)
async def create_customer_type(
    request: CustomerTypeCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new customer_type"""

    try:
        command = CreateCustomerTypeCommand(
            code=request.code,
            name=request.name,

        )
        customer_type = await mediator.send(command)
        return SalesApiMapper.customer_type_to_response(customer_type)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=CustomerTypeListResponse)
async def list_customer_types(
    search: Optional[str] = Query(None, description="Search term for customer_type code or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search customer_types with optional filters"""

    try:
        result = await mediator.query(
            SearchCustomerTypesQuery(
                search=search,
                is_active=is_active,
                skip=skip,
                limit=limit,
            )
        )
        items = [SalesApiMapper.customer_type_to_response(customer_type) for customer_type in result.items]
        return CustomerTypeListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{customer_type_id}", response_model=CustomerTypeResponse)
async def get_customer_type(
    customer_type_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a customer_type by identifier"""

    try:
        customer_type = await mediator.query(GetCustomerTypeByIdQuery(customer_type_id=customer_type_id))
        return SalesApiMapper.customer_type_to_response(customer_type)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{customer_type_id}", response_model=CustomerTypeResponse)
async def update_customer_type(
    customer_type_id: str,
    request: CustomerTypeUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update customer_type fields"""

    try:
        command = UpdateCustomerTypeCommand(
            customer_type_id=customer_type_id,
            code=request.code,
            name=request.name,

        )
        customer_type = await mediator.send(command)
        return SalesApiMapper.customer_type_to_response(customer_type)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{customer_type_id}", status_code=204)
async def delete_customer_type(
    customer_type_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a customer_type (soft-delete by default)"""

    try:
        await mediator.send(DeleteCustomerTypeCommand(customer_type_id=customer_type_id))
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))



