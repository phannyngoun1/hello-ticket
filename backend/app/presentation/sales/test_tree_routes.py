"""FastAPI routes for Sales test_trees"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.sales.commands_test_tree import (
    CreateTestTreeCommand,
    UpdateTestTreeCommand,
    DeleteTestTreeCommand,

)
from app.application.sales.queries_test_tree import (
    GetTestTreeByIdQuery,
    GetTestTreeTreeQuery,
    SearchTestTreesQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.sales.schemas_test_tree import (
    TestTreeCreateRequest,
    TestTreeListResponse,
    TestTreeResponse,
    TestTreeTreeResponse,
    TestTreeUpdateRequest,
)
from app.presentation.api.sales.mapper_test_tree import SalesApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.MANAGE_SALES_TEST_TREE
VIEW_PERMISSION = Permission.VIEW_SALES_TEST_TREE

router = APIRouter(prefix="/sales/test-trees", tags=["sales"])


@router.post("", response_model=TestTreeResponse, status_code=201)
async def create_test_tree(
    request: TestTreeCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new test_tree"""

    try:
        command = CreateTestTreeCommand(
            code=request.code,
            name=request.name,
            parent_test_tree_id=request.parent_test_tree_id,
            sort_order=request.sort_order,

        )
        test_tree = await mediator.send(command)
        return SalesApiMapper.test_tree_to_response(test_tree)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=TestTreeListResponse)
async def list_test_trees(
    search: Optional[str] = Query(None, description="Search term for test_tree code or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search test_trees with optional filters"""

    try:
        result = await mediator.query(
            SearchTestTreesQuery(
                search=search,
                is_active=is_active,
                skip=skip,
                limit=limit,
            )
        )
        items = [SalesApiMapper.test_tree_to_response(test_tree) for test_tree in result.items]
        return TestTreeListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/tree/root", response_model=List[TestTreeTreeResponse])
async def get_test_tree_tree(
    include_inactive: bool = Query(False, description="Include inactive test_trees"),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Get test_tree tree (root test_trees with full hierarchy)"""
    try:
        query = GetTestTreeTreeQuery(include_inactive=include_inactive)
        tree = await mediator.query(query)
        return [SalesApiMapper.test_tree_tree_to_response(node) for node in tree]
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{test_tree_id}", response_model=TestTreeResponse)
async def get_test_tree(
    test_tree_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a test_tree by identifier"""

    try:
        test_tree = await mediator.query(GetTestTreeByIdQuery(test_tree_id=test_tree_id))
        return SalesApiMapper.test_tree_to_response(test_tree)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{test_tree_id}", response_model=TestTreeResponse)
async def update_test_tree(
    test_tree_id: str,
    request: TestTreeUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update test_tree fields"""

    try:
        command = UpdateTestTreeCommand(
            test_tree_id=test_tree_id,
            code=request.code,
            name=request.name,
            parent_test_tree_id=request.parent_test_tree_id,
            sort_order=request.sort_order,

        )
        test_tree = await mediator.send(command)
        return SalesApiMapper.test_tree_to_response(test_tree)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{test_tree_id}", status_code=204)
async def delete_test_tree(
    test_tree_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a test_tree (soft-delete by default)"""

    try:
        await mediator.send(DeleteTestTreeCommand(test_tree_id=test_tree_id))
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))



