"""FastAPI routes for {{ModuleName}} {{EntityNamePluralLower}}"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.{{moduleName}}.commands_{{EntityNameLower}} import (
    Create{{EntityName}}Command,
    Update{{EntityName}}Command,
    Delete{{EntityName}}Command,
{{ActivateDeactivateCommandImports}}
)
from app.application.{{moduleName}}.queries_{{EntityNameLower}} import (
    Get{{EntityName}}ByIdQuery,
    Get{{EntityName}}TreeQuery,
    Search{{EntityNamePlural}}Query,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.{{moduleName}}.schemas_{{EntityNameLower}} import (
    {{EntityName}}CreateRequest,
    {{EntityName}}ListResponse,
    {{EntityName}}Response,
    {{EntityName}}TreeResponse,
    {{EntityName}}UpdateRequest,
)
from app.presentation.api.{{moduleName}}.mapper_{{EntityNameLower}} import {{ModuleNameCapitalized}}ApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

# Permission constants for easy management and code generation
MANAGE_PERMISSION = Permission.{{Permission}}
VIEW_PERMISSION = Permission.VIEW_{{PermissionPrefix}}

router = APIRouter(prefix="/{{moduleName}}/{{EntityNamePluralKebab}}", tags=["{{moduleName}}"])


@router.post("", response_model={{EntityName}}Response, status_code=201)
async def create_{{EntityNameLower}}(
    request: {{EntityName}}CreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new {{EntityNameLower}}"""

    try:
        command = Create{{EntityName}}Command(
            code=request.code,
            name=request.name,
            parent_{{EntityNameLower}}_id=request.parent_{{EntityNameLower}}_id,
            sort_order=request.sort_order,
{{CreateCommandFields}}
        )
        {{EntityNameLower}} = await mediator.send(command)
        return {{ModuleNameCapitalized}}ApiMapper.{{EntityNameLower}}_to_response({{EntityNameLower}})
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model={{EntityName}}ListResponse)
async def list_{{EntityNamePluralSnake}}(
    search: Optional[str] = Query(None, description="Search term for {{EntityNameLower}} code or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search {{EntityNamePluralLower}} with optional filters"""

    try:
        result = await mediator.query(
            Search{{EntityNamePlural}}Query(
                search=search,
                is_active=is_active,
                skip=skip,
                limit=limit,
            )
        )
        items = [{{ModuleNameCapitalized}}ApiMapper.{{EntityNameLower}}_to_response({{EntityNameLower}}) for {{EntityNameLower}} in result.items]
        return {{EntityName}}ListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/tree/root", response_model=List[{{EntityName}}TreeResponse])
async def get_{{EntityNameLower}}_tree(
    include_inactive: bool = Query(False, description="Include inactive {{EntityNamePluralLower}}"),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Get {{EntityNameLower}} tree (root {{EntityNamePluralLower}} with full hierarchy)"""
    try:
        query = Get{{EntityName}}TreeQuery(include_inactive=include_inactive)
        tree = await mediator.query(query)
        return [{{ModuleNameCapitalized}}ApiMapper.{{EntityNameLower}}_tree_to_response(node) for node in tree]
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{{{EntityNameLower}}_id}", response_model={{EntityName}}Response)
async def get_{{EntityNameLower}}(
    {{EntityNameLower}}_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([VIEW_PERMISSION, MANAGE_PERMISSION])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a {{EntityNameLower}} by identifier"""

    try:
        {{EntityNameLower}} = await mediator.query(Get{{EntityName}}ByIdQuery({{EntityNameLower}}_id={{EntityNameLower}}_id))
        return {{ModuleNameCapitalized}}ApiMapper.{{EntityNameLower}}_to_response({{EntityNameLower}})
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{{{EntityNameLower}}_id}", response_model={{EntityName}}Response)
async def update_{{EntityNameLower}}(
    {{EntityNameLower}}_id: str,
    request: {{EntityName}}UpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update {{EntityNameLower}} fields"""

    try:
        command = Update{{EntityName}}Command(
            {{EntityNameLower}}_id={{EntityNameLower}}_id,
            code=request.code,
            name=request.name,
            parent_{{EntityNameLower}}_id=request.parent_{{EntityNameLower}}_id,
            sort_order=request.sort_order,
{{UpdateCommandFields}}
        )
        {{EntityNameLower}} = await mediator.send(command)
        return {{ModuleNameCapitalized}}ApiMapper.{{EntityNameLower}}_to_response({{EntityNameLower}})
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{{{EntityNameLower}}_id}", status_code=204)
async def delete_{{EntityNameLower}}(
    {{EntityNameLower}}_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a {{EntityNameLower}} (soft-delete by default)"""

    try:
        await mediator.send(Delete{{EntityName}}Command({{EntityNameLower}}_id={{EntityNameLower}}_id))
        return Response(status_code=204)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

{{ActivateDeactivateRoutes}}

