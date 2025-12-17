"""FastAPI routes for Sales tests"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.sales.commands_test import (
    CreateTestCommand,
    UpdateTestCommand,
    DeleteTestCommand,

)
from app.application.sales.queries_test import (
    GetTestByIdQuery,
    SearchTestsQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.sales.schemas_test import (
    TestCreateRequest,
    TestListResponse,
    TestResponse,
    TestUpdateRequest,
)
from app.presentation.api.sales.mapper_test import SalesApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.MANAGE_SALES_TEST
VIEW_PERMISSION = Permission.VIEW_SALES_TEST

router = APIRouter(prefix="/sales/tests", tags=["sales"])


@router.post("", response_model=TestResponse, status_code=201)
async def create_test(
    request: TestCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new test"""

    try:
        command = CreateTestCommand(
            code=request.code,
            name=request.name,

        )
        test = await mediator.send(command)
        return SalesApiMapper.test_to_response(test)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=TestListResponse)
async def list_tests(
    search: Optional[str] = Query(None, description="Search term for test code or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search tests with optional filters"""

    try:
        result = await mediator.query(
            SearchTestsQuery(
                search=search,
                is_active=is_active,
                skip=skip,
                limit=limit,
            )
        )
        items = [SalesApiMapper.test_to_response(test) for test in result.items]
        return TestListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{test_id}", response_model=TestResponse)
async def get_test(
    test_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a test by identifier"""

    try:
        test = await mediator.query(GetTestByIdQuery(test_id=test_id))
        return SalesApiMapper.test_to_response(test)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{test_id}", response_model=TestResponse)
async def update_test(
    test_id: str,
    request: TestUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update test fields"""

    try:
        command = UpdateTestCommand(
            test_id=test_id,
            code=request.code,
            name=request.name,

        )
        test = await mediator.send(command)
        return SalesApiMapper.test_to_response(test)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{test_id}", status_code=204)
async def delete_test(
    test_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a test (soft-delete by default)"""

    try:
        await mediator.send(DeleteTestCommand(test_id=test_id))
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))



