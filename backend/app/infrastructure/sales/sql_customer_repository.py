"""
Customer repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_, or_, func
from sqlalchemy.exc import IntegrityError
import re
from app.domain.sales.customer import Customer
from app.domain.sales.repositories import CustomerRepository, CustomerSearchResult
from app.infrastructure.shared.database.models import CustomerModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.sales.mapper_customer import CustomerMapper
from app.domain.shared.tag_repository import TagLinkRepository
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError
from app.infrastructure.shared.repository import BaseSQLRepository


class SQLCustomerRepository(BaseSQLRepository[Customer, CustomerModel], CustomerRepository):
    """SQLModel implementation of CustomerRepository using BaseSQLRepository"""
    
    def __init__(
        self,
        session: Optional[Session] = None,
        tenant_id: Optional[str] = None,
        tag_link_repository: Optional[TagLinkRepository] = None,
    ):
        super().__init__(
            model_cls=CustomerModel,
            mapper=CustomerMapper(tag_link_repository=tag_link_repository),
            session_factory=session,
            tenant_id=tenant_id
        )
        self._tag_link_repository = tag_link_repository
    
    async def _load_tags(self, customer: Customer) -> Customer:
        """Helper to load tags for a customer"""
        if self._tag_link_repository and customer:
            tags = await self._tag_link_repository.get_tags_for_entity(
                tenant_id=customer.tenant_id,
                entity_type="customer",
                entity_id=customer.id,
            )
            customer.tags = [tag.name for tag in tags]
        return customer

    async def save(self, customer: Customer) -> Customer:
        """Save or update a customer"""
        # specialized save handled by BaseSQLRepository, then load tags
        saved_customer = await super().save(customer)
        return await self._load_tags(saved_customer)
    
    async def get_by_id(self, tenant_id: str, customer_id: str) -> Optional[Customer]:
        """Get customer by ID (within tenant scope)"""
        customer = await super().get_by_id(tenant_id, customer_id)
        if customer:
            return await self._load_tags(customer)
        return None
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Customer]:
        """Get customer by business code"""
        if not code or not code.strip():
            return None
        
        # Override BaseSQLRepository since it might not have get_by_code or implementation differs
        # Wait, BaseSQLRepository doesn't have get_by_code.
        # Custom implementation:
        with self._session_factory() as session:
            statement = select(CustomerModel).where(
                CustomerModel.tenant_id == tenant_id,
                CustomerModel.code == code.strip().upper()
            )
            model = session.exec(statement).first()
            if not model:
                return None
            customer = self._mapper.to_domain(model)
            return await self._load_tags(customer)
    
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> CustomerSearchResult:
        """Search customers by term and status"""
        with self._session_factory() as session:
            conditions = [CustomerModel.tenant_id == tenant_id]
            
            if search:
                search_term = f"%{search}%"
                conditions.append(
                    or_(
                        CustomerModel.code.ilike(search_term),
                        CustomerModel.name.ilike(search_term),
                        CustomerModel.email.ilike(search_term),
                        CustomerModel.phone.ilike(search_term),
                        CustomerModel.business_name.ilike(search_term)
                    )
                )
            
            if is_active is not None:
                conditions.append(CustomerModel.is_active == is_active)
            
            # Count total
            count_statement = select(func.count(CustomerModel.id)).where(and_(*conditions))
            total = session.exec(count_statement).one()
            
            # Get paginated results
            statement = (
                select(CustomerModel)
                .where(and_(*conditions))
                .order_by(CustomerModel.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            
            items = []
            for model in models:
                customer = self._mapper.to_domain(model)
                # Load tags from TagLinkRepository if available
                if self._tag_link_repository:
                    tags = await self._tag_link_repository.get_tags_for_entity(
                        tenant_id=tenant_id,
                        entity_type="customer",
                        entity_id=customer.id,
                    )
                    customer.tags = [tag.name for tag in tags]
                items.append(customer)
            
            has_next = skip + limit < total
            
            return CustomerSearchResult(items=items, total=total, has_next=has_next)
    
    async def delete(self, tenant_id: str, customer_id: str) -> bool:
        """Delete a customer (soft-delete by marking inactive)"""
        # CUSTOM implementation because 'is_active' vs 'is_deleted' semantics
        with self._session_factory() as session:
            statement = select(CustomerModel).where(
                CustomerModel.id == customer_id,
                CustomerModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            if not model:
                return False
            
            # Soft delete: mark as inactive
            from datetime import datetime, timezone
            model.is_active = False
            model.deactivated_at = datetime.now(timezone.utc)
            model.updated_at = datetime.now(timezone.utc)
            
            try:
                session.commit()
                return True
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to delete customer: {str(e)}")
    
    async def generate_next_code(self, tenant_id: str) -> str:
        """Generate the next available customer code in format C-000000"""
        with self._session_factory() as session:
            # Get all customers for this tenant with codes matching C-XXXXXX pattern
            statement = select(CustomerModel.code).where(
                CustomerModel.tenant_id == tenant_id,
                CustomerModel.code.like('C-%')
            )
            codes = session.exec(statement).all()
            
            # Pattern to match C-XXXXXX format
            pattern = re.compile(r'^C-(\d+)$', re.IGNORECASE)
            
            max_number = 0
            for code in codes:
                match = pattern.match(code)
                if match:
                    try:
                        number = int(match.group(1))
                        max_number = max(max_number, number)
                    except ValueError:
                        continue
            
            # Increment and format
            next_number = max_number + 1
            return f"C-{next_number:06d}"

