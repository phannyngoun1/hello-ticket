"""FastAPI routes for Sales employees"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.sales.commands_employee import (
    CreateEmployeeCommand,
    UpdateEmployeeCommand,
    DeleteEmployeeCommand,

)
from app.application.sales.queries_employee import (
    GetEmployeeByIdQuery,
    SearchEmployeesQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.sales.schemas_employee import (
    EmployeeCreateRequest,
    EmployeeListResponse,
    EmployeeResponse,
    EmployeeUpdateRequest,
)
from app.presentation.api.sales.mapper_employee import SalesApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.MANAGE_SALES_EMPLOYEE
VIEW_PERMISSION = Permission.VIEW_SALES_EMPLOYEE

router = APIRouter(prefix="/sales/employees", tags=["sales"])


@router.post("", response_model=EmployeeResponse, status_code=201)
async def create_employee(
    request: EmployeeCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new employee"""

    try:
        command = CreateEmployeeCommand(
            code=request.code,
            name=request.name,

        )
        employee = await mediator.send(command)
        return SalesApiMapper.employee_to_response(employee)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=EmployeeListResponse)
async def list_employees(
    search: Optional[str] = Query(None, description="Search term for employee code or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search employees with optional filters"""

    try:
        result = await mediator.query(
            SearchEmployeesQuery(
                search=search,
                is_active=is_active,
                skip=skip,
                limit=limit,
            )
        )
        items = [SalesApiMapper.employee_to_response(employee) for employee in result.items]
        return EmployeeListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a employee by identifier"""

    try:
        employee = await mediator.query(GetEmployeeByIdQuery(employee_id=employee_id))
        return SalesApiMapper.employee_to_response(employee)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: str,
    request: EmployeeUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update employee fields"""

    try:
        command = UpdateEmployeeCommand(
            employee_id=employee_id,
            code=request.code,
            name=request.name,

        )
        employee = await mediator.send(command)
        return SalesApiMapper.employee_to_response(employee)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{employee_id}", status_code=204)
async def delete_employee(
    employee_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a employee (soft-delete by default)"""

    try:
        await mediator.send(DeleteEmployeeCommand(employee_id=employee_id))
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))



