"""
Inventory Balance repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from decimal import Decimal
from sqlmodel import Session, select, and_
from sqlalchemy.exc import IntegrityError
from app.domain.inventory.balance import InventoryBalance
from app.domain.inventory.repositories import InventoryBalanceRepository
from app.infrastructure.shared.database.models import InventoryBalanceModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.inventory.mapper import InventoryBalanceMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError


class SQLInventoryBalanceRepository(InventoryBalanceRepository):
    """SQLModel implementation of InventoryBalanceRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._mapper = InventoryBalanceMapper()
        self._tenant_id = tenant_id  # Override tenant context if provided
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, balance: InventoryBalance) -> InventoryBalance:
        """Save or update inventory balance (with optimistic locking)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if balance exists
            statement = select(InventoryBalanceModel).where(
                InventoryBalanceModel.id == balance.id,
                InventoryBalanceModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                # Optimistic locking check
                if existing_model.version != balance.version:
                    raise BusinessRuleError(
                        f"Balance {balance.id} has been modified by another transaction. "
                        f"Expected version {balance.version}, but found {existing_model.version}"
                    )
                
                # Update existing balance
                existing_model.quantity = balance.quantity
                existing_model.status = balance.status
                existing_model.tracking_id = balance.tracking_id
                existing_model.version = balance.version
                existing_model.updated_at = balance.updated_at
                
                session.add(existing_model)
                try:
                    session.commit()
                    session.refresh(existing_model)
                    return self._mapper.to_domain(existing_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update balance: {str(e)}")
            else:
                # Create new balance
                new_model = self._mapper.to_model(balance)
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    return self._mapper.to_domain(new_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create balance: {str(e)}")
    
    async def get_by_id(self, balance_id: str) -> Optional[InventoryBalance]:
        """Get balance by ID"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(InventoryBalanceModel).where(
                InventoryBalanceModel.id == balance_id,
                InventoryBalanceModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def find_balance(
        self,
        tenant_id: str,
        item_id: str,
        location_id: str,
        tracking_id: Optional[str] = None,
        status: str = "available"
    ) -> Optional[InventoryBalance]:
        """Find specific balance by all key fields"""
        with self._session_factory() as session:
            conditions = [
                InventoryBalanceModel.tenant_id == tenant_id,
                InventoryBalanceModel.item_id == item_id,
                InventoryBalanceModel.location_id == location_id,
                InventoryBalanceModel.status == status
            ]
            
            if tracking_id:
                conditions.append(InventoryBalanceModel.tracking_id == tracking_id)
            else:
                conditions.append(InventoryBalanceModel.tracking_id.is_(None))
            
            statement = select(InventoryBalanceModel).where(and_(*conditions))
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_balances_by_item(
        self,
        tenant_id: str,
        item_id: str,
        location_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[InventoryBalance]:
        """Get all balances for an item"""
        with self._session_factory() as session:
            conditions = [
                InventoryBalanceModel.tenant_id == tenant_id,
                InventoryBalanceModel.item_id == item_id
            ]
            
            if location_id:
                conditions.append(InventoryBalanceModel.location_id == location_id)
            
            if status:
                conditions.append(InventoryBalanceModel.status == status)
            
            statement = select(InventoryBalanceModel).where(and_(*conditions))
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def get_available_quantity(
        self,
        tenant_id: str,
        item_id: str,
        location_id: str
    ) -> Decimal:
        """Get total available quantity for item/location"""
        with self._session_factory() as session:
            statement = select(InventoryBalanceModel).where(
                InventoryBalanceModel.tenant_id == tenant_id,
                InventoryBalanceModel.item_id == item_id,
                InventoryBalanceModel.location_id == location_id,
                InventoryBalanceModel.status == "available"
            )
            models = session.exec(statement).all()
            return sum(model.quantity for model in models)
