"""
Inventory Transaction repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from decimal import Decimal
from sqlmodel import Session, select, and_
from sqlalchemy.exc import IntegrityError
from app.domain.inventory.repositories import InventoryTransactionRepository
from app.domain.inventory.transaction import InventoryTransaction
from app.infrastructure.shared.database.models import InventoryTransactionModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError
from app.shared.utils import generate_id


class SQLInventoryTransactionRepository(InventoryTransactionRepository):
    """SQLModel implementation of InventoryTransactionRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._tenant_id = tenant_id  # Override tenant context if provided
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    def _model_to_entity(self, model: InventoryTransactionModel) -> InventoryTransaction:
        """Convert model to domain entity"""
        return InventoryTransaction(
            id=model.id,
            tenant_id=model.tenant_id,
            occurred_at=model.occurred_at,
            type=model.type,
            item_id=model.item_id,
            quantity=model.quantity,
            uom=model.uom,
            location_id=getattr(model, 'location_id', None),
            tracking_id=getattr(model, 'tracking_id', None),
            cost_per_unit=model.cost_per_unit,
            source_ref_type=model.source_ref_type,
            source_ref_id=model.source_ref_id,
            reason_code=model.reason_code,
            actor_id=model.actor_id,
            idempotency_key=model.idempotency_key,
            created_at=model.created_at,
            # Deprecated fields
            warehouse_id=model.warehouse_id,
            bin_id=model.bin_id,
            lot_id=model.lot_id,
            serial_id=model.serial_id,
        )
    
    def _entity_to_model(self, transaction: InventoryTransaction) -> InventoryTransactionModel:
        """Convert domain entity to model"""
        return InventoryTransactionModel(
            id=transaction.id,
            tenant_id=transaction.tenant_id,
            occurred_at=transaction.occurred_at,
            type=transaction.type,
            item_id=transaction.item_id,
            quantity=transaction.quantity,
            uom=transaction.uom,
            location_id=transaction.location_id,
            tracking_id=transaction.tracking_id,
            cost_per_unit=transaction.cost_per_unit,
            source_ref_type=transaction.source_ref_type,
            source_ref_id=transaction.source_ref_id,
            reason_code=transaction.reason_code,
            actor_id=transaction.actor_id,
            idempotency_key=transaction.idempotency_key,
            # Deprecated fields
            warehouse_id=transaction.warehouse_id,
            bin_id=transaction.bin_id,
            lot_id=transaction.lot_id,
            serial_id=transaction.serial_id,
        )
    
    def _model_to_dict(self, model: InventoryTransactionModel) -> Dict[str, Any]:
        """Convert model to dictionary (for backward compatibility)"""
        return {
            "id": model.id,
            "tenant_id": model.tenant_id,
            "occurred_at": model.occurred_at,
            "type": model.type,
            "item_id": model.item_id,
            "quantity": float(model.quantity) if model.quantity else None,
            "uom": model.uom,
            "warehouse_id": model.warehouse_id,  # Deprecated
            "bin_id": model.bin_id,  # Deprecated
            "location_id": getattr(model, 'location_id', None),
            "lot_id": model.lot_id,  # Deprecated
            "serial_id": model.serial_id,  # Deprecated
            "tracking_id": getattr(model, 'tracking_id', None),
            "cost_per_unit": float(model.cost_per_unit) if model.cost_per_unit else None,
            "source_ref_type": model.source_ref_type,
            "source_ref_id": model.source_ref_id,
            "reason_code": model.reason_code,
            "actor_id": model.actor_id,
            "idempotency_key": model.idempotency_key,
            "created_at": model.created_at
        }
    
    async def save(self, transaction: InventoryTransaction) -> InventoryTransaction:
        """Save an inventory transaction"""
        tenant_id = self._get_tenant_id()
        
        if transaction.tenant_id != tenant_id:
            raise BusinessRuleError("Transaction tenant mismatch")
        
        with self._session_factory() as session:
            # Check for idempotency if key provided
            if transaction.idempotency_key:
                existing = session.exec(
                    select(InventoryTransactionModel).where(
                        InventoryTransactionModel.tenant_id == tenant_id,
                        InventoryTransactionModel.idempotency_key == transaction.idempotency_key
                    )
                ).first()
                if existing:
                    return self._model_to_entity(existing)
            
            # Check if transaction already exists
            existing_model = session.get(InventoryTransactionModel, transaction.id)
            if existing_model:
                # Transactions are immutable, return existing
                return self._model_to_entity(existing_model)
            
            # Create new transaction
            model = self._entity_to_model(transaction)
            if not model.created_at:
                model.created_at = datetime.now(timezone.utc)
            
            session.add(model)
            try:
                session.commit()
                session.refresh(model)
                return self._model_to_entity(model)
            except IntegrityError as e:
                session.rollback()
                error_msg = str(e).lower()
                if "unique constraint" in error_msg or "duplicate key" in error_msg:
                    # Return existing if idempotency key collision
                    if transaction.idempotency_key:
                        existing = session.exec(
                            select(InventoryTransactionModel).where(
                                InventoryTransactionModel.tenant_id == tenant_id,
                                InventoryTransactionModel.idempotency_key == transaction.idempotency_key
                            )
                        ).first()
                        if existing:
                            return self._model_to_entity(existing)
                raise BusinessRuleError(f"Failed to create transaction: {str(e)}")
    
    async def save_transaction(self, transaction_data: dict) -> str:
        """Save a transaction record and return transaction ID"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check for idempotency if key provided
            if transaction_data.get("idempotency_key"):
                existing = session.exec(
                    select(InventoryTransactionModel).where(
                        InventoryTransactionModel.tenant_id == tenant_id,
                        InventoryTransactionModel.idempotency_key == transaction_data["idempotency_key"]
                    )
                ).first()
                if existing:
                    return existing.id
            
            # Create new transaction
            transaction_id = transaction_data.get("id") or generate_id()
            model = InventoryTransactionModel(
                id=transaction_id,
                tenant_id=tenant_id,
                occurred_at=transaction_data.get("occurred_at", datetime.now(timezone.utc)),
                type=transaction_data["type"],
                item_id=transaction_data["item_id"],
                quantity=Decimal(str(transaction_data["quantity"])),
                uom=transaction_data["uom"],
                warehouse_id=transaction_data.get("warehouse_id"),  # Deprecated
                bin_id=transaction_data.get("bin_id"),  # Deprecated
                location_id=transaction_data.get("location_id"),
                lot_id=transaction_data.get("lot_id"),  # Deprecated
                serial_id=transaction_data.get("serial_id"),  # Deprecated
                tracking_id=transaction_data.get("tracking_id"),
                cost_per_unit=Decimal(str(transaction_data["cost_per_unit"])) if transaction_data.get("cost_per_unit") else None,
                source_ref_type=transaction_data.get("source_ref_type"),
                source_ref_id=transaction_data.get("source_ref_id"),
                reason_code=transaction_data.get("reason_code"),
                actor_id=transaction_data.get("actor_id"),
                idempotency_key=transaction_data.get("idempotency_key")
            )
            
            session.add(model)
            try:
                session.commit()
                session.refresh(model)
                return model.id
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to create transaction: {str(e)}")
    
    async def get_by_id(self, transaction_id: str) -> Optional[InventoryTransaction]:
        """Get transaction by ID"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(InventoryTransactionModel).where(
                InventoryTransactionModel.id == transaction_id,
                InventoryTransactionModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._model_to_entity(model) if model else None
    
    async def get_by_item(
        self,
        tenant_id: str,
        item_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[InventoryTransaction]:
        """Get transactions for an item"""
        with self._session_factory() as session:
            statement = (
                select(InventoryTransactionModel)
                .where(
                    InventoryTransactionModel.tenant_id == tenant_id,
                    InventoryTransactionModel.item_id == item_id
                )
                .order_by(InventoryTransactionModel.occurred_at.desc())
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            return [self._model_to_entity(model) for model in models]
    
    async def get_by_reference(
        self,
        tenant_id: str,
        reference_type: str,
        reference_id: str
    ) -> List[InventoryTransaction]:
        """Get transactions by reference"""
        with self._session_factory() as session:
            statement = select(InventoryTransactionModel).where(
                InventoryTransactionModel.tenant_id == tenant_id,
                InventoryTransactionModel.source_ref_type == reference_type,
                InventoryTransactionModel.source_ref_id == reference_id
            ).order_by(InventoryTransactionModel.occurred_at.desc())
            models = session.exec(statement).all()
            return [self._model_to_entity(model) for model in models]
    
    async def get_by_date_range(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime,
        location_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get transactions within date range"""
        with self._session_factory() as session:
            conditions = [
                InventoryTransactionModel.tenant_id == tenant_id,
                InventoryTransactionModel.occurred_at >= start_date,
                InventoryTransactionModel.occurred_at <= end_date
            ]
            
            if location_id:
                conditions.append(InventoryTransactionModel.location_id == location_id)
            
            statement = (
                select(InventoryTransactionModel)
                .where(and_(*conditions))
                .order_by(InventoryTransactionModel.occurred_at.desc())
            )
            models = session.exec(statement).all()
            return [self._model_to_dict(model) for model in models]

