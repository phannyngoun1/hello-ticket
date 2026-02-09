"""FastAPI routes for company address management"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime

from app.domain.shared.authenticated_user import AuthenticatedUser
from app.presentation.core.dependencies.auth_dependencies import RequirePermission
from app.domain.shared.value_objects.role import Permission

router = APIRouter(prefix="/company-addresses", tags=["company-addresses"])


# Schemas
class CompanyAddressResponse(BaseModel):
    id: str
    tenant_id: Optional[str] = None
    name: str
    address_type: str  # "default" | "billing" | "shipping"
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_default: bool
    notes: Optional[str] = None
    created_at: str
    updated_at: str


class CompanyAddressCreateRequest(BaseModel):
    name: str
    address_type: str  # "default" | "billing" | "shipping"
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = False
    notes: Optional[str] = None


class CompanyAddressUpdateRequest(BaseModel):
    name: Optional[str] = None
    address_type: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None
    notes: Optional[str] = None


class CompanyAddressListResponse(BaseModel):
    items: List[CompanyAddressResponse]
    skip: Optional[int] = 0
    limit: Optional[int] = 50
    has_next: Optional[bool] = False


# Stub implementation - returns empty data for now
# TODO: Implement proper domain logic, repository, commands, and queries

@router.get("", response_model=CompanyAddressListResponse)
async def get_company_addresses(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    address_type: Optional[str] = Query(None, description="Filter by address type"),
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.READ_USER)),
):
    """Get all company addresses"""
    # Stub implementation - returns empty list
    return CompanyAddressListResponse(
        items=[],
        skip=skip,
        limit=limit,
        has_next=False,
    )


@router.get("/{address_id}", response_model=CompanyAddressResponse)
async def get_company_address(
    address_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.READ_USER)),
):
    """Get a company address by ID"""
    raise HTTPException(status_code=404, detail=f"Company address with ID '{address_id}' not found")


@router.post("", response_model=CompanyAddressResponse, status_code=201)
async def create_company_address(
    request: CompanyAddressCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_USER)),
):
    """Create a new company address"""
    # Stub implementation - returns a mock response
    now = datetime.now().isoformat()
    return CompanyAddressResponse(
        id="stub-id",
        tenant_id=current_user.tenant_id,
        name=request.name,
        address_type=request.address_type,
        street=request.street,
        city=request.city,
        state=request.state,
        postal_code=request.postal_code,
        country=request.country,
        is_default=request.is_default or False,
        notes=request.notes,
        created_at=now,
        updated_at=now,
    )


@router.put("/{address_id}", response_model=CompanyAddressResponse)
async def update_company_address(
    address_id: str,
    request: CompanyAddressUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_USER)),
):
    """Update a company address"""
    raise HTTPException(status_code=404, detail=f"Company address with ID '{address_id}' not found")


@router.delete("/{address_id}", status_code=204)
async def delete_company_address(
    address_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_USER)),
):
    """Delete a company address"""
    raise HTTPException(status_code=404, detail=f"Company address with ID '{address_id}' not found")
