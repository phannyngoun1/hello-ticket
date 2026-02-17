"""FastAPI routes for Sales id_types - uses unified lookup_values table (read-only for dropdowns)"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.application.shared.queries_lookup import SearchLookupsQuery
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.core.dependencies.auth_dependencies import RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import ValidationError

# Allow anyone who can view customers to list id types (for customer form dropdown)
VIEW_PERMISSIONS = [Permission.VIEW_SALES_CUSTOMER, Permission.VIEW_SALES_CUSTOMER_TYPE]
TYPE_CODE = "id_type"

router = APIRouter(prefix="/sales/id-types", tags=["sales"])


@router.get("")
async def list_id_types(
    search: Optional[str] = Query(None, description="Search term for id_type code or name"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission(VIEW_PERMISSIONS)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """List id_types for dropdowns (e.g. customer form)"""

    try:
        result = await mediator.query(
            SearchLookupsQuery(
                type_code=TYPE_CODE,
                search=search,
                is_active=is_active,
                skip=skip,
                limit=limit,
            )
        )
        items = [
            {"id": l.id, "code": l.code, "name": l.name}
            for l in result.items
        ]
        return {
            "items": items,
            "skip": skip,
            "limit": limit,
            "total": result.total,
            "has_next": result.has_next,
        }
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
