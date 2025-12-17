"""FastAPI routes for Sales test_basics"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.sales.commands_test_basic import (
    CreateTestBasicCommand,
    UpdateTestBasicCommand,
    DeleteTestBasicCommand,

)
from app.application.sales.queries_test_basic import (
    GetTestBasicByIdQuery,
    SearchTestBasicsQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.sales.schemas_test_basic import (
    TestBasicCreateRequest,
    TestBasicListResponse,
    TestBasicResponse,
    TestBasicUpdateRequest,
)
from app.presentation.api.sales.mapper_test_basic import SalesApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.MANAGE_SALES_TEST_BASIC
VIEW_PERMISSION = Permission.VIEW_SALES_TEST_BASIC

router = APIRouter(prefix="/sales/test-basics", tags=["sales"])


@router.post("", response_model=TestBasicResponse, status_code=201)
async def create_test_basic(
    request: TestBasicCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new test_basic"""

    try:
        command = CreateTestBasicCommand(
            code=request.code,
            name=request.name,

        )
        test_basic = await mediator.send(command)
        return SalesApiMapper.test_basic_to_response(test_basic)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=TestBasicListResponse)
async def list_test_basics(
    search: Optional[str] = Query(None, description="Search term for test_basic code or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search test_basics with optional filters"""

    try:
        result = await mediator.query(
            SearchTestBasicsQuery(
                search=search,
                is_active=is_active,
                skip=skip,
                limit=limit,
            )
        )
        items = [SalesApiMapper.test_basic_to_response(test_basic) for test_basic in result.items]
        return TestBasicListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{test_basic_id}", response_model=TestBasicResponse)
async def get_test_basic(
    test_basic_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a test_basic by identifier"""

    try:
        test_basic = await mediator.query(GetTestBasicByIdQuery(test_basic_id=test_basic_id))
        return SalesApiMapper.test_basic_to_response(test_basic)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{test_basic_id}", response_model=TestBasicResponse)
async def update_test_basic(
    test_basic_id: str,
    request: TestBasicUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update test_basic fields"""

    try:
        command = UpdateTestBasicCommand(
            test_basic_id=test_basic_id,
            code=request.code,
            name=request.name,

        )
        test_basic = await mediator.send(command)
        return SalesApiMapper.test_basic_to_response(test_basic)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{test_basic_id}", status_code=204)
async def delete_test_basic(
    test_basic_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a test_basic (soft-delete by default)"""

    try:
        await mediator.send(DeleteTestBasicCommand(test_basic_id=test_basic_id))
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))



