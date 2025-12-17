"""
FastAPI routes for Company Addresses

Company addresses are addresses assigned to entity_type="company" with tenant_id as entity_id.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query

from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.domain.shared.address import Address
from app.domain.shared.address_assignment import AddressAssignment
from app.domain.shared.repositories import AddressRepository, AddressAssignmentRepository
from app.infrastructure.shared.address_repository import (
    SQLAddressRepository,
    SQLAddressAssignmentRepository,
)
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.shared.tenant_context import require_tenant_context
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

router = APIRouter(prefix="/company-addresses", tags=["company", "addresses"])

# Initialize repositories
_address_repo: Optional[AddressRepository] = None
_assignment_repo: Optional[AddressAssignmentRepository] = None

def get_address_repository() -> AddressRepository:
    """Get address repository instance"""
    global _address_repo
    if _address_repo is None:
        _address_repo = SQLAddressRepository()
    return _address_repo

def get_assignment_repository() -> AddressAssignmentRepository:
    """Get address assignment repository instance"""
    global _assignment_repo
    if _assignment_repo is None:
        _assignment_repo = SQLAddressAssignmentRepository()
    return _assignment_repo

# Response schemas
from pydantic import BaseModel
from datetime import datetime

class CompanyAddressResponse(BaseModel):
    """Company address response model"""
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

class CompanyAddressListResponse(BaseModel):
    """Paginated company address list response"""
    items: List[CompanyAddressResponse]
    skip: int
    limit: int
    total: int
    has_next: bool

class CompanyAddressCreateRequest(BaseModel):
    """Company address create request"""
    name: str
    address_type: str  # "default" | "billing" | "shipping"
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_default: bool = False
    notes: Optional[str] = None

class CompanyAddressUpdateRequest(BaseModel):
    """Company address update request"""
    name: Optional[str] = None
    address_type: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None
    notes: Optional[str] = None

def _to_company_address_response(
    address: Address,
    assignment: AddressAssignment
) -> CompanyAddressResponse:
    """Convert Address and AddressAssignment to CompanyAddressResponse"""
    # Name is required for company addresses
    if not address.name:
        raise ValueError("Address name is required for company addresses")
    
    return CompanyAddressResponse(
        id=assignment.id,  # Use assignment ID as the primary identifier
        tenant_id=address.tenant_id,
        name=address.name,
        address_type=assignment.address_type,
        street=address.street,
        city=address.city,
        state=address.state,
        postal_code=address.postal_code,
        country=address.country,
        is_default=assignment.is_primary,
        notes=address.notes,
        created_at=address.created_at.isoformat() if address.created_at else "",
        updated_at=address.updated_at.isoformat() if address.updated_at else "",
    )

@router.get("", response_model=CompanyAddressListResponse)
async def list_company_addresses(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=200),
    address_type: Optional[str] = Query(None, description="Filter by address type"),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([
        Permission.VIEW_PURCHASE_ORDER,
        Permission.CREATE_PURCHASE_ORDER,
    ])),
    address_repo: AddressRepository = Depends(get_address_repository),
    assignment_repo: AddressAssignmentRepository = Depends(get_assignment_repository),
):
    """List company addresses with optional filters"""
    try:
        tenant_id = require_tenant_context()
        entity_id = tenant_id  # Use tenant_id as entity_id for company addresses
        
        # Get all assignments for company entity
        assignments = await assignment_repo.list_by_entity(
            tenant_id=tenant_id,
            entity_type=AddressAssignment.ENTITY_TYPE_COMPANY,
            entity_id=entity_id,
            address_type=address_type,
        )
        
        # Fetch addresses for each assignment
        addresses_with_assignments = []
        for assignment in assignments:
            address = await address_repo.get_by_id(tenant_id, assignment.address_id)
            if address:
                addresses_with_assignments.append((address, assignment))
        
        # Apply pagination
        total = len(addresses_with_assignments)
        paginated_items = addresses_with_assignments[skip:skip + limit]
        has_next = skip + limit < total
        
        items = [
            _to_company_address_response(addr, assign)
            for addr, assign in paginated_items
        ]
        
        return CompanyAddressListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=total,
            has_next=has_next,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{address_id}", response_model=CompanyAddressResponse)
async def get_company_address(
    address_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([
        Permission.VIEW_PURCHASE_ORDER,
        Permission.CREATE_PURCHASE_ORDER,
    ])),
    address_repo: AddressRepository = Depends(get_address_repository),
    assignment_repo: AddressAssignmentRepository = Depends(get_assignment_repository),
):
    """Get a company address by ID (assignment ID)"""
    try:
        tenant_id = require_tenant_context()
        entity_id = tenant_id
        
        # Get assignment by ID
        assignment = await assignment_repo.get_by_id(tenant_id, address_id)
        if not assignment:
            raise NotFoundError("Company address not found")
        
        # Verify it's a company address
        if (assignment.entity_type != AddressAssignment.ENTITY_TYPE_COMPANY or
            assignment.entity_id != entity_id):
            raise NotFoundError("Company address not found")
        
        # Get the address
        address = await address_repo.get_by_id(tenant_id, assignment.address_id)
        if not address:
            raise NotFoundError("Address not found")
        
        return _to_company_address_response(address, assignment)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=CompanyAddressResponse, status_code=201)
async def create_company_address(
    request: CompanyAddressCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_PURCHASE_ORDER)),
    address_repo: AddressRepository = Depends(get_address_repository),
    assignment_repo: AddressAssignmentRepository = Depends(get_assignment_repository),
):
    """Create a new company address"""
    try:
        tenant_id = require_tenant_context()
        entity_id = tenant_id
        
        # Validate address type
        valid_types = ["default", "billing", "shipping"]
        if request.address_type not in valid_types:
            raise ValidationError(f"Address type must be one of: {', '.join(valid_types)}")
        
        # Create address
        address = Address(
            tenant_id=tenant_id,
            name=request.name,
            street=request.street,
            city=request.city,
            state=request.state,
            postal_code=request.postal_code,
            country=request.country,
            notes=request.notes,
        )
        address = await address_repo.save(address)
        
        # If this is set as default, unset other defaults
        if request.is_default:
            existing_assignments = await assignment_repo.list_by_entity(
                tenant_id=tenant_id,
                entity_type=AddressAssignment.ENTITY_TYPE_COMPANY,
                entity_id=entity_id,
            )
            for existing_assignment in existing_assignments:
                if existing_assignment.is_primary:
                    existing_assignment.unset_as_primary()
                    await assignment_repo.save(existing_assignment)
        
        # Create address assignment
        assignment = AddressAssignment(
            tenant_id=tenant_id,
            address_id=address.id,
            entity_type=AddressAssignment.ENTITY_TYPE_COMPANY,
            entity_id=entity_id,
            address_type=request.address_type,
            is_primary=request.is_default,
        )
        assignment = await assignment_repo.save(assignment)
        
        return _to_company_address_response(address, assignment)
    except (ValidationError, BusinessRuleError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{address_id}", response_model=CompanyAddressResponse)
async def update_company_address(
    address_id: str,
    request: CompanyAddressUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_PURCHASE_ORDER)),
    address_repo: AddressRepository = Depends(get_address_repository),
    assignment_repo: AddressAssignmentRepository = Depends(get_assignment_repository),
):
    """Update a company address"""
    try:
        tenant_id = require_tenant_context()
        entity_id = tenant_id
        
        # Get assignment
        assignment = await assignment_repo.get_by_id(tenant_id, address_id)
        if not assignment:
            raise NotFoundError("Company address not found")
        
        # Verify it's a company address
        if (assignment.entity_type != AddressAssignment.ENTITY_TYPE_COMPANY or
            assignment.entity_id != entity_id):
            raise NotFoundError("Company address not found")
        
        # Get address
        address = await address_repo.get_by_id(tenant_id, assignment.address_id)
        if not address:
            raise NotFoundError("Address not found")
        
        # Update address fields
        if request.name is not None:
            address.update_details(name=request.name)
        if request.street is not None:
            address.update_details(street=request.street)
        if request.city is not None:
            address.update_details(city=request.city)
        if request.state is not None:
            address.update_details(state=request.state)
        if request.postal_code is not None:
            address.update_details(postal_code=request.postal_code)
        if request.country is not None:
            address.update_details(country=request.country)
        if request.notes is not None:
            address.update_details(notes=request.notes)
        
        address = await address_repo.save(address)
        
        # Update assignment
        if request.address_type is not None:
            assignment.update_assignment(address_type=request.address_type)
        if request.is_default is not None:
            if request.is_default:
                # Unset other defaults
                existing_assignments = await assignment_repo.list_by_entity(
                    tenant_id=tenant_id,
                    entity_type=AddressAssignment.ENTITY_TYPE_COMPANY,
                    entity_id=entity_id,
                )
                for existing_assignment in existing_assignments:
                    if existing_assignment.id != assignment.id and existing_assignment.is_primary:
                        existing_assignment.unset_as_primary()
                        await assignment_repo.save(existing_assignment)
                assignment.set_as_primary()
            else:
                assignment.unset_as_primary()
        
        assignment = await assignment_repo.save(assignment)
        
        return _to_company_address_response(address, assignment)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (ValidationError, BusinessRuleError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{address_id}", status_code=204)
async def delete_company_address(
    address_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_PURCHASE_ORDER)),
    address_repo: AddressRepository = Depends(get_address_repository),
    assignment_repo: AddressAssignmentRepository = Depends(get_assignment_repository),
):
    """Delete a company address"""
    try:
        tenant_id = require_tenant_context()
        entity_id = tenant_id
        
        # Get assignment
        assignment = await assignment_repo.get_by_id(tenant_id, address_id)
        if not assignment:
            raise NotFoundError("Company address not found")
        
        # Verify it's a company address
        if (assignment.entity_type != AddressAssignment.ENTITY_TYPE_COMPANY or
            assignment.entity_id != entity_id):
            raise NotFoundError("Company address not found")
        
        # Delete assignment
        await assignment_repo.delete(tenant_id, assignment.id)
        
        # Check if address is used by other assignments
        other_assignments = await assignment_repo.list_by_address(tenant_id, assignment.address_id)
        if not other_assignments:
            # No other assignments, delete the address too
            await address_repo.delete(tenant_id, assignment.address_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
