"""
CustomerType repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_, or_
from sqlalchemy.exc import IntegrityError
from app.domain.sales.customer_type import CustomerType
from app.domain.sales.customer_type_repositories import CustomerTypeRepository, CustomerTypeSearchResult
from app.infrastructure.shared.database.models import CustomerTypeModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.sales.mapper_customer_type import CustomerTypeMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError


class SQLCustomerTypeRepository(CustomerTypeRepository):
    """SQLModel implementation of CustomerTypeRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._mapper = CustomerTypeMapper()
        self._tenant_id = tenant_id  # Override tenant context if provided
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, customer_type: CustomerType) -> CustomerType:
        """Save or update a customer_type"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if customer_type exists (within tenant scope)
            statement = select(CustomerTypeModel).where(
                CustomerTypeModel.id == customer_type.id,
                CustomerTypeModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                # Update existing customer_type
                # Use merge with a new model instance to ensure proper change tracking
                updated_model = self._mapper.to_model(customer_type)
                # Merge will update the existing model in the session
                merged_model = session.merge(updated_model)
                try:
                    session.commit()
                    session.refresh(merged_model)
                    return self._mapper.to_domain(merged_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update customer_type: {str(e)}")
            else:
                # Create new customer_type
                new_model = self._mapper.to_model(customer_type)
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    return self._mapper.to_domain(new_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create customer_type: {str(e)}")
    
    async def get_by_id(self, tenant_id: str, customer_type_id: str) -> Optional[CustomerType]:
        """Get customer_type by ID (within tenant scope)"""
        with self._session_factory() as session:
            statement = select(CustomerTypeModel).where(
                CustomerTypeModel.id == customer_type_id,
                CustomerTypeModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[CustomerType]:
        """Get customer_type by business code"""
        if not code or not code.strip():
            return None
        with self._session_factory() as session:
            statement = select(CustomerTypeModel).where(
                CustomerTypeModel.tenant_id == tenant_id,
                CustomerTypeModel.code == code.strip().upper()
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        include_deleted: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> CustomerTypeSearchResult:
        """Search customer_types by term and status"""
        with self._session_factory() as session:
            conditions = [CustomerTypeModel.tenant_id == tenant_id]
            
            # Exclude deleted records by default
            if not include_deleted:
                conditions.append(CustomerTypeModel.is_deleted == False)
            
            if search:
                search_term = f"%{search}%"
                conditions.append(
                    or_(
                        CustomerTypeModel.code.ilike(search_term),
                        CustomerTypeModel.name.ilike(search_term)
                    )
                )
            
            if is_active is not None:
                conditions.append(CustomerTypeModel.is_active == is_active)
            
            # Count total
            count_statement = select(CustomerTypeModel).where(and_(*conditions))
            all_models = session.exec(count_statement).all()
            total = len(all_models)
            
            # Get paginated results
            statement = (
                select(CustomerTypeModel)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            
            items = [self._mapper.to_domain(model) for model in models]
            has_next = skip + limit < total
            
            return CustomerTypeSearchResult(items=items, total=total, has_next=has_next)
    
    async def get_all(self, tenant_id: str) -> List[CustomerType]:
        """Get all customer_types for a tenant"""
        with self._session_factory() as session:
            statement = select(CustomerTypeModel).where(
                CustomerTypeModel.tenant_id == tenant_id
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def delete(self, tenant_id: str, customer_type_id: str, hard_delete: bool = False) -> bool:
        """Delete a customer_type (soft-delete by default, hard-delete if specified)"""
        with self._session_factory() as session:
            statement = select(CustomerTypeModel).where(
                CustomerTypeModel.id == customer_type_id,
                CustomerTypeModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            if not model:
                return False
            
            if hard_delete:
                # Hard delete: permanently remove from database
                session.delete(model)
            else:
                # Soft delete: mark as deleted
                from datetime import datetime, timezone
                model.is_deleted = True
                model.deleted_at = datetime.now(timezone.utc)
                model.updated_at = datetime.now(timezone.utc)
                # Model is already in session from .first(), SQLAlchemy tracks changes automatically
            
            try:
                session.commit()
                return True
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to delete customer_type: {str(e)}")

