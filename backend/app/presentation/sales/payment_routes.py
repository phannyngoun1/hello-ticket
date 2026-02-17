"""FastAPI routes for Sales payments."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List

from app.application.sales.commands_payment import CreatePaymentCommand, CancelPaymentCommand
from app.application.sales.handlers_payment import PaymentCommandHandler
from app.presentation.api.sales.schemas_payment import (
    PaymentCreateRequest,
    PaymentResponse,
    PaymentListResponse,
)
from app.presentation.core.dependencies.auth_dependencies import RequirePermission
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.domain.sales.payment_repositories import PaymentRepository
from app.domain.shared.value_objects.role import Permission
from app.shared.container import container

# Permission constants
MANAGE_PERMISSION = Permission.MANAGE_SALES_BOOKING  # Reuse booking permission for now

router = APIRouter(prefix="/sales/payments", tags=["sales"])


def get_payment_command_handler() -> PaymentCommandHandler:
    """Get payment command handler from container"""
    return container.resolve(PaymentCommandHandler)


def get_payment_repository() -> PaymentRepository:
    """Get payment repository from container"""
    return container.resolve(PaymentRepository)


@router.post("", status_code=201, response_model=PaymentResponse)
async def create_payment(
    request: PaymentCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    handler: PaymentCommandHandler = Depends(get_payment_command_handler),
):
    """Create a payment for a booking"""
    try:
        command = CreatePaymentCommand(
            booking_id=request.booking_id,
            amount=request.amount,
            payment_method=request.payment_method,
            currency=request.currency,
            transaction_reference=request.transaction_reference,
            notes=request.notes,
        )
        payment = await handler.handle_create_payment(command)
        
        return PaymentResponse(
            id=payment.id,
            tenant_id=payment.tenant_id,
            booking_id=payment.booking_id,
            payment_code=payment.payment_code,
            amount=payment.amount,
            currency=payment.currency,
            payment_method=payment.payment_method.value,
            status=payment.status.value,
            transaction_reference=payment.transaction_reference,
            notes=payment.notes,
            processed_at=payment.processed_at,
            created_at=payment.created_at,
            updated_at=payment.updated_at,
            version=payment.version,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=PaymentListResponse)
async def list_payments(
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    repository: PaymentRepository = Depends(get_payment_repository),
):
    """Get all payments for the current tenant"""
    from app.shared.tenant_context import require_tenant_context
    tenant_id = require_tenant_context()
    
    payments = await repository.get_all(tenant_id)
    
    return PaymentListResponse(
        items=[
            PaymentResponse(
                id=p.id,
                tenant_id=p.tenant_id,
                booking_id=p.booking_id,
                amount=p.amount,
                currency=p.currency,
                payment_method=p.payment_method.value,
                status=p.status.value,
                transaction_reference=p.transaction_reference,
                notes=p.notes,
                processed_at=p.processed_at,
                created_at=p.created_at,
                updated_at=p.updated_at,
                version=p.version,
            )
            for p in payments
        ],
        total=len(payments),
        has_next=False,
    )


@router.get("/booking/{booking_id}", response_model=PaymentListResponse)
async def get_payments_by_booking(
    booking_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    repository: PaymentRepository = Depends(get_payment_repository),
):
    """Get all payments for a booking"""
    from app.shared.tenant_context import require_tenant_context
    tenant_id = require_tenant_context()
    
    payments = await repository.get_by_booking(tenant_id, booking_id)
    
    return PaymentListResponse(
        items=[
            PaymentResponse(
                id=p.id,
                tenant_id=p.tenant_id,
                booking_id=p.booking_id,
                amount=p.amount,
                currency=p.currency,
                payment_method=p.payment_method.value,
                status=p.status.value,
                transaction_reference=p.transaction_reference,
                notes=p.notes,
                processed_at=p.processed_at,
                created_at=p.created_at,
                updated_at=p.updated_at,
                version=p.version,
            )
            for p in payments
        ],
        total=len(payments),
        has_next=False,
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    repository: PaymentRepository = Depends(get_payment_repository),
):
    """Get a single payment by ID"""
    from app.shared.tenant_context import require_tenant_context
    tenant_id = require_tenant_context()

    payment = await repository.get_by_id(tenant_id, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    return PaymentResponse(
        id=payment.id,
        tenant_id=payment.tenant_id,
        booking_id=payment.booking_id,
        payment_code=payment.payment_code,
        amount=payment.amount,
        currency=payment.currency,
        payment_method=payment.payment_method.value,
        status=payment.status.value,
        transaction_reference=payment.transaction_reference,
        notes=payment.notes,
        processed_at=payment.processed_at,
        created_at=payment.created_at,
        updated_at=payment.updated_at,
        version=payment.version,
    )


@router.post("/{payment_id}/cancel", response_model=PaymentResponse)
async def cancel_payment(
    payment_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(MANAGE_PERMISSION)),
    handler: PaymentCommandHandler = Depends(get_payment_command_handler),
):
    """Cancel/void a payment"""
    try:
        command = CancelPaymentCommand(payment_id=payment_id)
        payment = await handler.handle_cancel_payment(command)
        
        return PaymentResponse(
            id=payment.id,
            tenant_id=payment.tenant_id,
            booking_id=payment.booking_id,
            payment_code=payment.payment_code,
            amount=payment.amount,
            currency=payment.currency,
            payment_method=payment.payment_method.value,
            status=payment.status.value,
            transaction_reference=payment.transaction_reference,
            notes=payment.notes,
            processed_at=payment.processed_at,
            created_at=payment.created_at,
            updated_at=payment.updated_at,
            version=payment.version,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except BusinessRuleError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

