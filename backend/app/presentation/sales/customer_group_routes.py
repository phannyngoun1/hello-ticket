"""FastAPI routes for Sales customer_groups"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.sales.commands_customer_group import (
    CreateCustomerGroupCommand,
    UpdateCustomerGroupCommand,
    DeleteCustomerGroupCommand,

)
from app.application.sales.queries_customer_group import (
    GetCustomerGroupByIdQuery,
    GetCustomerGroupTreeQuery,
    SearchCustomerGroupsQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.sales.schemas_customer_group import (
    CustomerGroupCreateRequest,
    CustomerGroupListResponse,
    CustomerGroupResponse,
    CustomerGroupTreeResponse,
    CustomerGroupUpdateRequest,
)
from app.presentation.api.sales.mapper_customer_group import SalesApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.MANAGE_SALES_CUSTOMER_GROUP
VIEW_PERMISSION = Permission.VIEW_SALES_CUSTOMER_GROUP

router = APIRouter(prefix="/sales/customer-groups", tags=["sales"])


@router.post("", response_model=CustomerGroupResponse, status_code=201)
async def create_customer_group(
    request: CustomerGroupCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new customer_group"""

    try:
        command = CreateCustomerGroupCommand(
            code=request.code,
            name=request.name,
            parent_id=request.parent_id,
            sort_order=request.sort_order,

        )
        customer_group = await mediator.send(command)
        return SalesApiMapper.customer_group_to_response(customer_group)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=CustomerGroupListResponse)
async def list_customer_groups(
    search: Optional[str] = Query(None, description="Search term for customer_group code or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search customer_groups with optional filters"""

    try:
        result = await mediator.query(
            SearchCustomerGroupsQuery(
                search=search,
                is_active=is_active,
                skip=skip,
                limit=limit,
            )
        )
        items = [SalesApiMapper.customer_group_to_response(customer_group) for customer_group in result.items]
        return CustomerGroupListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/tree/root", response_model=List[CustomerGroupTreeResponse])
async def get_customer_group_tree(
    include_inactive: bool = Query(False, description="Include inactive customer groups"),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Get customer_group tree (root customer groups with full hierarchy)"""
    try:
        query = GetCustomerGroupTreeQuery(include_inactive=include_inactive)
        tree = await mediator.query(query)
        return [SalesApiMapper.customer_group_tree_to_response(cg) for cg in tree]
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{customer_group_id}", response_model=CustomerGroupResponse)
async def get_customer_group(
    customer_group_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a customer_group by identifier"""

    try:
        customer_group = await mediator.query(GetCustomerGroupByIdQuery(customer_group_id=customer_group_id))
        return SalesApiMapper.customer_group_to_response(customer_group)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{customer_group_id}", response_model=CustomerGroupResponse)
async def update_customer_group(
    customer_group_id: str,
    request: CustomerGroupUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update customer_group fields"""

    try:
        command = UpdateCustomerGroupCommand(
            customer_group_id=customer_group_id,
            code=request.code,
            name=request.name,
            parent_id=request.parent_id,
            sort_order=request.sort_order,

        )
        customer_group = await mediator.send(command)
        return SalesApiMapper.customer_group_to_response(customer_group)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{customer_group_id}", status_code=204)
async def delete_customer_group(
    customer_group_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a customer_group (soft-delete by default)"""

    try:
        await mediator.send(DeleteCustomerGroupCommand(customer_group_id=customer_group_id))
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))



