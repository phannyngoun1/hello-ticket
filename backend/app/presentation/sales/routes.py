"""FastAPI routes for sales customers"""
from typing import Optional, List
import logging

from fastapi import APIRouter, Depends, HTTPException, Query

from app.application.sales import (
    CreateCustomerCommand,
    UpdateCustomerCommand,
    DeleteCustomerCommand,

    GetCustomerByIdQuery,
    SearchCustomersQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.sales.schemas import (
    CustomerCreateRequest,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdateRequest,
)
from app.presentation.api.sales.mapper import SalesApiMapper
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError

router = APIRouter(prefix="/sales/customers", tags=["sales"])

@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    request: CustomerCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new customer"""

    try:
        command = CreateCustomerCommand(
            name=request.name,
            email=request.email,
            phone=request.phone,
            business_name=request.business_name,
            street_address=request.street_address,
            city=request.city,
            state_province=request.state_province,
            postal_code=request.postal_code,
            country=request.country,
            date_of_birth=request.date_of_birth,
            gender=request.gender,
            nationality=request.nationality,
            id_number=request.id_number,
            id_type=request.id_type,
            event_preferences=request.event_preferences,
            seating_preferences=request.seating_preferences,
            accessibility_needs=request.accessibility_needs,
            dietary_restrictions=request.dietary_restrictions,
            emergency_contact_name=request.emergency_contact_name,
            emergency_contact_phone=request.emergency_contact_phone,
            emergency_contact_relationship=request.emergency_contact_relationship,
            preferred_language=request.preferred_language,
            marketing_opt_in=request.marketing_opt_in,
            email_marketing=request.email_marketing,
            sms_marketing=request.sms_marketing,
            facebook_url=request.facebook_url,
            twitter_handle=request.twitter_handle,
            linkedin_url=request.linkedin_url,
            instagram_handle=request.instagram_handle,
            website=request.website,
            tag_ids=request.tag_ids or [],
            priority=request.priority,
            notes=request.notes,
            public_notes=request.public_notes,
        )
        customer = await mediator.send(command)
        return SalesApiMapper.customer_to_response(customer)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.get("", response_model=CustomerListResponse)
async def list_customers(
    search: Optional[str] = Query(None, description="Search term for customer code or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([Permission.VIEW_SALES_CUSTOMER, Permission.CREATE_SALES_CUSTOMER])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search customers with optional filters"""

    try:
        result = await mediator.query(
            SearchCustomersQuery(
                search=search,
                is_active=is_active,
                skip=skip,
                limit=limit,
            )
        )
        items = [SalesApiMapper.customer_to_response(customer) for customer in result.items]
        return CustomerListResponse(
            items=items,
            skip=skip,
            limit=limit,
            total=result.total,
            has_next=result.has_next,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([Permission.VIEW_SALES_CUSTOMER, Permission.CREATE_SALES_CUSTOMER])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Retrieve a customer by identifier"""

    try:
        customer = await mediator.query(GetCustomerByIdQuery(customer_id=customer_id))
        return SalesApiMapper.customer_to_response(customer)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    request: CustomerUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update customer fields"""

    try:
        # Tags should be managed via tag service - only accept tag_ids
        command = UpdateCustomerCommand(
            customer_id=customer_id,
            name=request.name,
            email=request.email,
            phone=request.phone,
            business_name=request.business_name,
            street_address=request.street_address,
            city=request.city,
            state_province=request.state_province,
            postal_code=request.postal_code,
            country=request.country,
            date_of_birth=request.date_of_birth,
            gender=request.gender,
            nationality=request.nationality,
            id_number=request.id_number,
            id_type=request.id_type,
            event_preferences=request.event_preferences,
            seating_preferences=request.seating_preferences,
            accessibility_needs=request.accessibility_needs,
            dietary_restrictions=request.dietary_restrictions,
            emergency_contact_name=request.emergency_contact_name,
            emergency_contact_phone=request.emergency_contact_phone,
            emergency_contact_relationship=request.emergency_contact_relationship,
            preferred_language=request.preferred_language,
            marketing_opt_in=request.marketing_opt_in,
            email_marketing=request.email_marketing,
            sms_marketing=request.sms_marketing,
            facebook_url=request.facebook_url,
            twitter_handle=request.twitter_handle,
            linkedin_url=request.linkedin_url,
            instagram_handle=request.instagram_handle,
            website=request.website,
            tag_ids=request.tag_ids,
            priority=request.priority,
            status=request.status,
            status_reason=request.status_reason,
            notes=request.notes,
            public_notes=request.public_notes,
        )
        customer = await mediator.send(command)
        return SalesApiMapper.customer_to_response(customer)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

@router.delete("/{customer_id}", status_code=204)
async def delete_customer(
    customer_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a customer"""

    try:
        await mediator.send(DeleteCustomerCommand(customer_id=customer_id))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
