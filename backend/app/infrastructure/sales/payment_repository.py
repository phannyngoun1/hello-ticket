"""
Payment repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_
from sqlalchemy.exc import IntegrityError
from app.domain.sales.payment import Payment
from app.domain.sales.payment_repositories import PaymentRepository
from app.infrastructure.shared.database.models import PaymentModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError
from app.shared.enums import PaymentStatusEnum, PaymentMethodEnum


class SQLPaymentRepository(PaymentRepository):
    """SQLModel implementation of PaymentRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._tenant_id = tenant_id
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    def _to_domain(self, model: PaymentModel) -> Payment:
        """Convert database model to domain entity"""
        return Payment(
            payment_id=model.id,  # payment_id parameter maps to id in Payment.__init__
            tenant_id=model.tenant_id,
            booking_id=model.booking_id,
            payment_code=model.payment_code,
            amount=model.amount,
            payment_method=PaymentMethodEnum(model.payment_method),
            status=PaymentStatusEnum(model.status),
            currency=model.currency,
            transaction_reference=model.transaction_reference,
            notes=model.notes,
            processed_at=model.processed_at,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    def _to_model(self, payment: Payment) -> PaymentModel:
        """Convert domain entity to database model"""
        return PaymentModel(
            id=payment.id,
            tenant_id=payment.tenant_id,
            booking_id=payment.booking_id,
            payment_code=payment.payment_code,
            amount=payment.amount,
            payment_method=payment.payment_method.value,
            status=payment.status.value,
            currency=payment.currency,
            transaction_reference=payment.transaction_reference,
            notes=payment.notes,
            processed_at=payment.processed_at,
            created_at=payment.created_at,
            updated_at=payment.updated_at,
            version=payment.version,
        )
    
    async def save(self, payment: Payment) -> Payment:
        """Save or update a payment"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if payment exists
            statement = select(PaymentModel).where(
                PaymentModel.id == payment.id,
                PaymentModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            payment_model = self._to_model(payment)
            
            if existing_model:
                # Update existing payment
                for key, value in payment_model.dict(exclude={'id', 'tenant_id', 'created_at'}).items():
                    setattr(existing_model, key, value)
                
                try:
                    session.commit()
                    session.refresh(existing_model)
                    return self._to_domain(existing_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update payment: {str(e)}")
            else:
                # Create new payment
                session.add(payment_model)
                try:
                    session.commit()
                    session.refresh(payment_model)
                    return self._to_domain(payment_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create payment: {str(e)}")
    
    async def get_by_id(self, tenant_id: str, payment_id: str) -> Optional[Payment]:
        """Get payment by ID"""
        with self._session_factory() as session:
            statement = select(PaymentModel).where(
                PaymentModel.id == payment_id,
                PaymentModel.tenant_id == tenant_id
            )
            payment_model = session.exec(statement).first()
            if not payment_model:
                return None
            return self._to_domain(payment_model)
    
    async def get_by_booking(self, tenant_id: str, booking_id: str) -> List[Payment]:
        """Get all payments for a booking"""
        with self._session_factory() as session:
            statement = select(PaymentModel).where(
                PaymentModel.tenant_id == tenant_id,
                PaymentModel.booking_id == booking_id
            ).order_by(PaymentModel.created_at.desc())
            payment_models = session.exec(statement).all()
            return [self._to_domain(model) for model in payment_models]
    
    async def get_all(self, tenant_id: str) -> List[Payment]:
        """Get all payments for a tenant"""
        with self._session_factory() as session:
            statement = select(PaymentModel).where(
                PaymentModel.tenant_id == tenant_id
            ).order_by(PaymentModel.created_at.desc())
            payment_models = session.exec(statement).all()
            return [self._to_domain(model) for model in payment_models]

