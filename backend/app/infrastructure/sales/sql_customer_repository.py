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


class SQLCustomerRepository(CustomerRepository):
    """SQLModel implementation of CustomerRepository"""
    
    def __init__(
        self,
        session: Optional[Session] = None,
        tenant_id: Optional[str] = None,
        tag_link_repository: Optional[TagLinkRepository] = None,
    ):
        self._session_factory = session if session else get_session_sync
        self._mapper = CustomerMapper(tag_link_repository=tag_link_repository)
        self._tenant_id = tenant_id  # Override tenant context if provided
        self._tag_link_repository = tag_link_repository
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, customer: Customer) -> Customer:
        """Save or update a customer"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if customer exists (within tenant scope)
            statement = select(CustomerModel).where(
                CustomerModel.id == customer.id,
                CustomerModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                # Update existing customer
                updated_model = self._mapper.to_model(customer)
                merged_model = session.merge(updated_model)
                try:
                    session.commit()
                    session.refresh(merged_model)
                    customer_domain = self._mapper.to_domain(merged_model, tenant_id=tenant_id)
                    # Load tags from TagLinkRepository if available
                    if self._tag_link_repository:
                        tags = await self._tag_link_repository.get_tags_for_entity(
                            tenant_id=tenant_id,
                            entity_type="customer",
                            entity_id=customer_domain.id,
                        )
                        customer_domain.tags = [tag.name for tag in tags]
                    return customer_domain
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update customer: {str(e)}")
            else:
                # Create new customer
                new_model = self._mapper.to_model(customer)
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    customer_domain = self._mapper.to_domain(new_model, tenant_id=tenant_id)
                    # Load tags from TagLinkRepository if available
                    if self._tag_link_repository:
                        tags = await self._tag_link_repository.get_tags_for_entity(
                            tenant_id=tenant_id,
                            entity_type="customer",
                            entity_id=customer_domain.id,
                        )
                        customer_domain.tags = [tag.name for tag in tags]
                    return customer_domain
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create customer: {str(e)}")
    
    async def get_by_id(self, tenant_id: str, customer_id: str) -> Optional[Customer]:
        """Get customer by ID (within tenant scope)"""
        with self._session_factory() as session:
            statement = select(CustomerModel).where(
                CustomerModel.id == customer_id,
                CustomerModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            if not model:
                return None
            customer = self._mapper.to_domain(model, tenant_id=tenant_id)
            # Load tags from TagLinkRepository if available
            if self._tag_link_repository:
                tags = await self._tag_link_repository.get_tags_for_entity(
                    tenant_id=tenant_id,
                    entity_type="customer",
                    entity_id=customer.id,
                )
                customer.tags = [tag.name for tag in tags]
            return customer
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Customer]:
        """Get customer by business code"""
        if not code or not code.strip():
            return None
        with self._session_factory() as session:
            statement = select(CustomerModel).where(
                CustomerModel.tenant_id == tenant_id,
                CustomerModel.code == code.strip().upper()
            )
            model = session.exec(statement).first()
            if not model:
                return None
            customer = self._mapper.to_domain(model, tenant_id=tenant_id)
            # Load tags from TagLinkRepository if available
            if self._tag_link_repository:
                tags = await self._tag_link_repository.get_tags_for_entity(
                    tenant_id=tenant_id,
                    entity_type="customer",
                    entity_id=customer.id,
                )
                customer.tags = [tag.name for tag in tags]
            return customer
    
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
                customer = self._mapper.to_domain(model, tenant_id=tenant_id)
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

