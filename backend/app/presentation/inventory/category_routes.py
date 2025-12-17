"""
Category Management API routes
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException

from app.application.inventory import (
    CreateCategoryCommand,
    UpdateCategoryCommand,
    DeleteCategoryCommand,
    GetCategoryByIdQuery,
    GetAllCategoriesQuery,
    GetCategoryTreeQuery,
    GetCategoryHierarchyQuery,
    GetCategoryChildrenQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.inventory.schemas import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryTreeResponse,
)
from app.presentation.core.dependencies.auth_dependencies import RequirePermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.exceptions import NotFoundError, BusinessRuleError, ValidationError, ConflictError
from app.shared.mediator import Mediator

router = APIRouter(prefix="/inventory/categories", tags=["inventory", "categories"])


@router.post("/", response_model=CategoryResponse, status_code=201)
async def create_category(
    category_data: CategoryCreate,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Create a new item category"""
    try:
        command = CreateCategoryCommand(
            code=category_data.code,
            name=category_data.name,
            description=category_data.description,
            parent_category_id=category_data.parent_category_id,
            sort_order=category_data.sort_order,
            is_active=category_data.is_active,
            attributes=category_data.attributes or {}
        )
        category = await mediator.send(command)
        return CategoryResponse(
            id=category.id,
            tenant_id=category.tenant_id,
            code=category.code,
            name=category.name,
            description=category.description,
            parent_category_id=category.parent_category_id,
            level=category.level,
            sort_order=category.sort_order,
            is_active=category.is_active,
            attributes=category.attributes,
            created_at=category.created_at,
            updated_at=category.updated_at,
        )
    except (BusinessRuleError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Get a category by ID"""
    try:
        query = GetCategoryByIdQuery(category_id=category_id)
        category = await mediator.query(query)
        if not category:
            raise NotFoundError(f"Category with ID {category_id} not found")
        return CategoryResponse(
            id=category.id,
            tenant_id=category.tenant_id,
            code=category.code,
            name=category.name,
            description=category.description,
            parent_category_id=category.parent_category_id,
            level=category.level,
            sort_order=category.sort_order,
            is_active=category.is_active,
            attributes=category.attributes,
            created_at=category.created_at,
            updated_at=category.updated_at,
        )
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/", response_model=List[CategoryResponse])
async def get_all_categories(
    parent_category_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Get all categories"""
    try:
        query = GetAllCategoriesQuery(
            parent_category_id=parent_category_id,
            is_active=is_active,
            skip=skip,
            limit=limit
        )
        categories = await mediator.query(query)
        return [
            CategoryResponse(
                id=cat.id,
                tenant_id=cat.tenant_id,
                code=cat.code,
                name=cat.name,
                description=cat.description,
                parent_category_id=cat.parent_category_id,
                level=cat.level,
                sort_order=cat.sort_order,
                is_active=cat.is_active,
                attributes=cat.attributes,
                created_at=cat.created_at,
                updated_at=cat.updated_at,
            )
            for cat in categories
        ]
    except (BusinessRuleError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/tree/root", response_model=List[CategoryTreeResponse])
async def get_category_tree(
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Get category tree (root categories with full hierarchy)"""
    try:
        query = GetCategoryTreeQuery()
        tree = await mediator.query(query)
        return tree
    except (BusinessRuleError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{category_id}/hierarchy")
async def get_category_hierarchy(
    category_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Get category hierarchy (with ancestors and descendants)"""
    try:
        query = GetCategoryHierarchyQuery(category_id=category_id)
        hierarchy = await mediator.query(query)
        return hierarchy
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (BusinessRuleError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{category_id}/children", response_model=List[CategoryResponse])
async def get_category_children(
    category_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Get direct children of a category"""
    try:
        query = GetCategoryChildrenQuery(category_id=category_id)
        children = await mediator.query(query)
        return [
            CategoryResponse(
                id=cat.id,
                tenant_id=cat.tenant_id,
                code=cat.code,
                name=cat.name,
                description=cat.description,
                parent_category_id=cat.parent_category_id,
                level=cat.level,
                sort_order=cat.sort_order,
                is_active=cat.is_active,
                attributes=cat.attributes,
                created_at=cat.created_at,
                updated_at=cat.updated_at,
            )
            for cat in children
        ]
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (BusinessRuleError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    category_data: CategoryUpdate,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Update a category"""
    try:
        command = UpdateCategoryCommand(
            category_id=category_id,
            code=category_data.code,
            name=category_data.name,
            description=category_data.description,
            parent_category_id=category_data.parent_category_id,
            sort_order=category_data.sort_order,
            is_active=category_data.is_active,
            attributes=category_data.attributes
        )
        category = await mediator.send(command)
        return CategoryResponse(
            id=category.id,
            tenant_id=category.tenant_id,
            code=category.code,
            name=category.name,
            description=category.description,
            parent_category_id=category.parent_category_id,
            level=category.level,
            sort_order=category.sort_order,
            is_active=category.is_active,
            attributes=category.attributes,
            created_at=category.created_at,
            updated_at=category.updated_at,
        )
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except (BusinessRuleError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{category_id}", status_code=204)
async def delete_category(
    category_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.DELETE_PRODUCT)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Delete a category"""
    try:
        command = DeleteCategoryCommand(category_id=category_id)
        await mediator.send(command)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except BusinessRuleError as e:
        raise HTTPException(status_code=400, detail=str(e))
