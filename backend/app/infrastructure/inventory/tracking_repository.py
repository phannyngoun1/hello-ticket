"""
Inventory Tracking repository implementation - Adapter in Hexagonal Architecture
"""
import logging
from typing import List, Optional
from datetime import date
from sqlmodel import Session, select, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text, func
from app.domain.inventory.repositories import InventoryTrackingRepository
from app.domain.inventory.tracking import InventoryTracking
from app.infrastructure.shared.database.models import InventoryTrackingModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError, ConflictError
from app.shared.utils import generate_id
from app.shared.enums import TrackingTypeEnum
from datetime import datetime, timezone
from app.infrastructure.shared.cache.query_cache import cache_query_result, invalidate_query_cache
from app.infrastructure.shared.monitoring.query_performance import monitor_query_performance

logger = logging.getLogger(__name__)


class SQLInventoryTrackingRepository(InventoryTrackingRepository):
    """SQLModel implementation of InventoryTrackingRepository"""
    
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
    
    def _model_to_entity(self, model: InventoryTrackingModel) -> InventoryTracking:
        """Convert model to domain entity"""
        return InventoryTracking(
            tenant_id=model.tenant_id,
            item_id=model.item_id,
            tracking_type=model.tracking_type,
            identifier=model.identifier,
            parent_tracking_id=model.parent_tracking_id,
            expiration_date=model.expiration_date,
            manufacturing_date=model.manufacturing_date,
            supplier_batch=model.supplier_batch,
            status=model.status,
            attributes=model.attributes or {},
            tracking_id=model.id,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def _entity_to_model(self, entity: InventoryTracking) -> InventoryTrackingModel:
        """Convert domain entity to model"""
        return InventoryTrackingModel(
            id=entity.id,
            tenant_id=entity.tenant_id,
            item_id=entity.item_id,
            tracking_type=entity.tracking_type,
            identifier=entity.identifier,
            parent_tracking_id=entity.parent_tracking_id,
            expiration_date=entity.expiration_date,
            manufacturing_date=entity.manufacturing_date,
            supplier_batch=entity.supplier_batch,
            status=entity.status,
            attributes=entity.attributes,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )
    
    async def save(self, tracking: InventoryTracking) -> InventoryTracking:
        """Save or update inventory tracking"""
        tenant_id = self._get_tenant_id()
        
        logger.info(
            f"Saving tracking {tracking.id} (type={tracking.tracking_type}, "
            f"identifier={tracking.identifier}, item={tracking.item_id}, tenant={tenant_id})"
        )
        
        try:
            # Validate parent tracking if provided
            if tracking.parent_tracking_id:
                parent = await self.get_by_id(tracking.parent_tracking_id)
                if not parent:
                    raise BusinessRuleError(
                        f"Parent tracking {tracking.parent_tracking_id} not found",
                        details={"parent_tracking_id": tracking.parent_tracking_id}
                    )
                if parent.item_id != tracking.item_id:
                    raise BusinessRuleError(
                        f"Parent tracking {tracking.parent_tracking_id} belongs to different item "
                        f"({parent.item_id} vs {tracking.item_id})",
                        details={
                            "parent_tracking_id": tracking.parent_tracking_id,
                            "parent_item_id": parent.item_id,
                            "tracking_item_id": tracking.item_id
                        }
                    )
                if parent.tenant_id != tracking.tenant_id:
                    raise BusinessRuleError(
                        f"Parent tracking {tracking.parent_tracking_id} belongs to different tenant",
                        details={
                            "parent_tracking_id": tracking.parent_tracking_id,
                            "parent_tenant_id": parent.tenant_id,
                            "tracking_tenant_id": tracking.tenant_id
                        }
                    )
                # Check for circular reference
                if tracking.id and tracking.id == tracking.parent_tracking_id:
                    raise BusinessRuleError(
                        f"Tracking cannot be its own parent (circular reference)",
                        details={"tracking_id": tracking.id}
                    )
        
            with self._session_factory() as session:
                # Check if tracking exists
                statement = select(InventoryTrackingModel).where(
                    InventoryTrackingModel.id == tracking.id,
                    InventoryTrackingModel.tenant_id == tenant_id
                )
                existing_model = session.exec(statement).first()
                
                if existing_model:
                    # Update existing
                    if tracking.identifier != existing_model.identifier:
                        # Check if new identifier already exists for this type
                        code_check = select(InventoryTrackingModel).where(
                            InventoryTrackingModel.tenant_id == tenant_id,
                            InventoryTrackingModel.item_id == tracking.item_id,
                            InventoryTrackingModel.tracking_type == tracking.tracking_type,
                            InventoryTrackingModel.identifier == tracking.identifier,
                            InventoryTrackingModel.id != tracking.id
                        )
                        if session.exec(code_check).first():
                            raise BusinessRuleError(
                                f"Tracking with identifier {tracking.identifier} and type {tracking.tracking_type} already exists"
                            )
                    
                    existing_model.identifier = tracking.identifier
                    existing_model.parent_tracking_id = tracking.parent_tracking_id
                    existing_model.expiration_date = tracking.expiration_date
                    existing_model.manufacturing_date = tracking.manufacturing_date
                    existing_model.supplier_batch = tracking.supplier_batch
                    existing_model.status = tracking.status
                    existing_model.attributes = tracking.attributes or {}
                    existing_model.updated_at = datetime.now(timezone.utc)
                    
                    session.add(existing_model)
                    try:
                        session.commit()
                        session.refresh(existing_model)
                        result = self._model_to_entity(existing_model)
                        logger.info(f"Successfully updated tracking {tracking.id}")
                        return result
                    except IntegrityError as e:
                        session.rollback()
                        error_msg = str(e).lower()
                        if "unique constraint" in error_msg or "duplicate key" in error_msg:
                            raise ConflictError(
                                f"Tracking with identifier '{tracking.identifier}' and type '{tracking.tracking_type}' "
                                f"already exists for item {tracking.item_id}",
                                details={
                                    "identifier": tracking.identifier,
                                    "tracking_type": tracking.tracking_type,
                                    "item_id": tracking.item_id
                                }
                            )
                        elif "foreign key" in error_msg:
                            raise BusinessRuleError(
                                f"Invalid reference in tracking: {str(e)}",
                                details={"error": str(e)}
                            )
                    else:
                        logger.error(
                            f"Failed to update tracking {tracking.id}: {str(e)}",
                            exc_info=True,
                            extra={
                                "tracking_id": tracking.id,
                                "tracking_type": tracking.tracking_type,
                                "identifier": tracking.identifier
                            }
                        )
                        raise BusinessRuleError(
                            f"Failed to update tracking: {str(e)}",
                            details={"error": str(e)}
                        )
                else:
                    # Create new
                    # Check if identifier already exists for this type
                    code_check = select(InventoryTrackingModel).where(
                        InventoryTrackingModel.tenant_id == tenant_id,
                        InventoryTrackingModel.item_id == tracking.item_id,
                        InventoryTrackingModel.tracking_type == tracking.tracking_type,
                        InventoryTrackingModel.identifier == tracking.identifier
                    )
                    if session.exec(code_check).first():
                        raise BusinessRuleError(
                            f"Tracking with identifier {tracking.identifier} and type {tracking.tracking_type} already exists"
                        )
                    
                    new_model = self._entity_to_model(tracking)
                    new_model.created_at = datetime.now(timezone.utc)
                    new_model.updated_at = datetime.now(timezone.utc)
                    
                    session.add(new_model)
                    try:
                        session.commit()
                        session.refresh(new_model)
                        result = self._model_to_entity(new_model)
                        logger.info(f"Successfully created tracking {tracking.id}")
                        return result
                    except IntegrityError as e:
                        session.rollback()
                        error_msg = str(e).lower()
                        if "unique constraint" in error_msg or "duplicate key" in error_msg:
                            raise ConflictError(
                                f"Tracking with identifier '{tracking.identifier}' and type '{tracking.tracking_type}' "
                                f"already exists for item {tracking.item_id}",
                                details={
                                    "identifier": tracking.identifier,
                                    "tracking_type": tracking.tracking_type,
                                    "item_id": tracking.item_id
                                }
                            )
                        elif "foreign key" in error_msg:
                            raise BusinessRuleError(
                                f"Invalid reference in tracking: {str(e)}",
                                details={"error": str(e)}
                            )
                    else:
                        logger.error(
                            f"Failed to create tracking {tracking.id}: {str(e)}",
                            exc_info=True,
                            extra={
                                "tracking_id": tracking.id,
                                "tracking_type": tracking.tracking_type,
                                "identifier": tracking.identifier
                            }
                        )
                        raise BusinessRuleError(
                            f"Failed to create tracking: {str(e)}",
                            details={"error": str(e)}
                        )
        except Exception as e:
            logger.error(
                f"Unexpected error saving tracking {tracking.id}: {str(e)}",
                exc_info=True,
                extra={"tracking_id": tracking.id}
            )
            raise
        
        # Invalidate cache after save
        invalidate_query_cache("tracking", tenant_id=tenant_id, item_id=tracking.item_id)
    
    @cache_query_result(ttl=3600, key_prefix="tracking")  # Cache for 1 hour
    @monitor_query_performance(threshold_ms=100)
    async def get_by_id(self, tracking_id: str) -> Optional[InventoryTracking]:
        """Get tracking by ID"""
        tenant_id = self._get_tenant_id()
        
        logger.debug(f"Getting tracking by ID: {tracking_id} (tenant: {tenant_id})")
        
        with self._session_factory() as session:
            statement = select(InventoryTrackingModel).where(
                InventoryTrackingModel.id == tracking_id,
                InventoryTrackingModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._model_to_entity(model) if model else None
    
    @cache_query_result(ttl=3600, key_prefix="tracking")
    @monitor_query_performance(threshold_ms=100)
    async def get_by_identifier(
        self,
        tenant_id: str,
        item_id: str,
        tracking_type: str,
        identifier: str
    ) -> Optional[InventoryTracking]:
        """Get tracking by identifier and type"""
        with self._session_factory() as session:
            statement = select(InventoryTrackingModel).where(
                InventoryTrackingModel.tenant_id == tenant_id,
                InventoryTrackingModel.item_id == item_id,
                InventoryTrackingModel.tracking_type == tracking_type,
                InventoryTrackingModel.identifier == identifier.upper().strip()
            )
            model = session.exec(statement).first()
            return self._model_to_entity(model) if model else None
    
    @cache_query_result(ttl=3600, key_prefix="tracking")
    @monitor_query_performance(threshold_ms=100)
    async def get_by_tracking_number(
        self,
        tenant_id: str,
        item_id: str,
        tracking_type: str,
        tracking_number: str
    ) -> Optional[InventoryTracking]:
        """Get tracking by tracking number (alias for get_by_identifier)"""
        return await self.get_by_identifier(tenant_id, item_id, tracking_type, tracking_number)
    
    @cache_query_result(ttl=3600, key_prefix="tracking")
    @monitor_query_performance(threshold_ms=100)
    async def get_by_item(
        self,
        tenant_id: str,
        item_id: str,
        tracking_type: Optional[str] = None
    ) -> List[InventoryTracking]:
        """Get all tracking records for an item"""
        with self._session_factory() as session:
            conditions = [
                InventoryTrackingModel.tenant_id == tenant_id,
                InventoryTrackingModel.item_id == item_id
            ]
            
            if tracking_type:
                conditions.append(InventoryTrackingModel.tracking_type == tracking_type)
            
            statement = select(InventoryTrackingModel).where(
                and_(*conditions)
            ).order_by(InventoryTrackingModel.created_at.desc())
            
            models = session.exec(statement).all()
            return [self._model_to_entity(model) for model in models]
    
    async def get_children(
        self,
        parent_tracking_id: str
    ) -> List[InventoryTracking]:
        """Get all direct children of a tracking"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(InventoryTrackingModel).where(
                InventoryTrackingModel.parent_tracking_id == parent_tracking_id,
                InventoryTrackingModel.tenant_id == tenant_id
            )
            models = session.exec(statement).all()
            return [self._model_to_entity(model) for model in models]
    
    async def get_descendants(
        self,
        tracking_id: str
    ) -> List[InventoryTracking]:
        """Get all descendants of a tracking (recursive)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Use recursive CTE to get all descendants
            query = text("""
                WITH RECURSIVE tracking_tree AS (
                    SELECT id, tenant_id, item_id, tracking_type, identifier, parent_tracking_id,
                           expiration_date, manufacturing_date, supplier_batch, status, attributes,
                           created_at, updated_at
                    FROM inventory_tracking
                    WHERE id = :tracking_id AND tenant_id = :tenant_id
                    
                    UNION ALL
                    
                    SELECT it.id, it.tenant_id, it.item_id, it.tracking_type, it.identifier,
                           it.parent_tracking_id, it.expiration_date, it.manufacturing_date,
                           it.supplier_batch, it.status, it.attributes,
                           it.created_at, it.updated_at
                    FROM inventory_tracking it
                    INNER JOIN tracking_tree tt ON it.parent_tracking_id = tt.id
                    WHERE it.tenant_id = :tenant_id
                )
                SELECT * FROM tracking_tree WHERE id != :tracking_id
            """)
            
            result = session.execute(
                query,
                {"tracking_id": tracking_id, "tenant_id": tenant_id}
            )
            
            trackings = []
            for row in result:
                model = InventoryTrackingModel(
                    id=row.id,
                    tenant_id=row.tenant_id,
                    item_id=row.item_id,
                    tracking_type=row.tracking_type,
                    identifier=row.identifier,
                    parent_tracking_id=row.parent_tracking_id,
                    expiration_date=row.expiration_date,
                    manufacturing_date=row.manufacturing_date,
                    supplier_batch=row.supplier_batch,
                    status=row.status,
                    attributes=row.attributes or {},
                    created_at=row.created_at,
                    updated_at=row.updated_at
                )
                trackings.append(self._model_to_entity(model))
            
            return trackings
    
    async def get_ancestors(
        self,
        tracking_id: str
    ) -> List[InventoryTracking]:
        """Get all ancestors of a tracking (up to root)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Use recursive CTE to get all ancestors
            query = text("""
                WITH RECURSIVE tracking_path AS (
                    SELECT id, tenant_id, item_id, tracking_type, identifier, parent_tracking_id,
                           expiration_date, manufacturing_date, supplier_batch, status, attributes,
                           created_at, updated_at
                    FROM inventory_tracking
                    WHERE id = :tracking_id AND tenant_id = :tenant_id
                    
                    UNION ALL
                    
                    SELECT it.id, it.tenant_id, it.item_id, it.tracking_type, it.identifier,
                           it.parent_tracking_id, it.expiration_date, it.manufacturing_date,
                           it.supplier_batch, it.status, it.attributes,
                           it.created_at, it.updated_at
                    FROM inventory_tracking it
                    INNER JOIN tracking_path tp ON it.id = tp.parent_tracking_id
                    WHERE it.tenant_id = :tenant_id
                )
                SELECT * FROM tracking_path WHERE id != :tracking_id
                ORDER BY parent_tracking_id NULLS FIRST
            """)
            
            result = session.execute(
                query,
                {"tracking_id": tracking_id, "tenant_id": tenant_id}
            )
            
            trackings = []
            for row in result:
                model = InventoryTrackingModel(
                    id=row.id,
                    tenant_id=row.tenant_id,
                    item_id=row.item_id,
                    tracking_type=row.tracking_type,
                    identifier=row.identifier,
                    parent_tracking_id=row.parent_tracking_id,
                    expiration_date=row.expiration_date,
                    manufacturing_date=row.manufacturing_date,
                    supplier_batch=row.supplier_batch,
                    status=row.status,
                    attributes=row.attributes or {},
                    created_at=row.created_at,
                    updated_at=row.updated_at
                )
                trackings.append(self._model_to_entity(model))
            
            return trackings
    
    async def get_by_type(
        self,
        tenant_id: str,
        item_id: str,
        tracking_type: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[InventoryTracking]:
        """Get all tracking of a specific type for an item"""
        with self._session_factory() as session:
            statement = (
                select(InventoryTrackingModel)
                .where(
                    InventoryTrackingModel.tenant_id == tenant_id,
                    InventoryTrackingModel.item_id == item_id,
                    InventoryTrackingModel.tracking_type == tracking_type
                )
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            return [self._model_to_entity(model) for model in models]
    
    async def get_expired(
        self,
        tenant_id: str,
        expiration_date: Optional[date] = None
    ) -> List[InventoryTracking]:
        """Get all expired tracking (or expiring before date)"""
        if expiration_date is None:
            from datetime import date
            expiration_date = date.today()
        
        with self._session_factory() as session:
            statement = select(InventoryTrackingModel).where(
                InventoryTrackingModel.tenant_id == tenant_id,
                InventoryTrackingModel.expiration_date.isnot(None),
                InventoryTrackingModel.expiration_date < expiration_date
            )
            models = session.exec(statement).all()
            return [self._model_to_entity(model) for model in models]
    
    async def delete(self, tracking_id: str) -> bool:
        """Delete tracking by ID with validation"""
        tenant_id = self._get_tenant_id()
        
        logger.info(f"Deleting tracking {tracking_id} (tenant: {tenant_id})")
        
        with self._session_factory() as session:
            statement = select(InventoryTrackingModel).where(
                InventoryTrackingModel.id == tracking_id,
                InventoryTrackingModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            
            if not model:
                return False
            
            # Check for circular reference risk (self-reference)
            if model.parent_tracking_id == tracking_id:
                raise BusinessRuleError(
                    f"Cannot delete tracking {tracking_id}: it references itself as parent (circular reference)",
                    details={"tracking_id": tracking_id}
                )
            
            # Check if tracking has children
            children = await self.get_children(tracking_id)
            if children:
                raise BusinessRuleError(
                    f"Cannot delete tracking {tracking_id}: it has {len(children)} child tracking. "
                    "Delete children first or use cascade delete.",
                    details={
                        "tracking_id": tracking_id,
                        "children_count": len(children),
                        "children_ids": [c.id for c in children]
                    }
                )
            
            # Check if tracking is used in inventory balances
            from app.infrastructure.shared.database.models import InventoryBalanceModel
            from sqlalchemy import func
            balance_count = session.exec(
                select(func.count(InventoryBalanceModel.id)).where(
                    InventoryBalanceModel.tracking_id == tracking_id,
                    InventoryBalanceModel.tenant_id == tenant_id
                )
            ).first()
            
            if balance_count and balance_count > 0:
                raise BusinessRuleError(
                    f"Cannot delete tracking {tracking_id}: it is used in {balance_count} inventory balance(s)",
                    details={
                        "tracking_id": tracking_id,
                        "balance_count": balance_count
                    }
                )
            
            # Check if tracking is referenced in transactions (immutable, so can't delete)
            from app.infrastructure.shared.database.models import InventoryTransactionModel
            transaction_count = session.exec(
                select(func.count(InventoryTransactionModel.id)).where(
                    InventoryTransactionModel.tracking_id == tracking_id,
                    InventoryTransactionModel.tenant_id == tenant_id
                )
            ).first()
            
            if transaction_count and transaction_count > 0:
                raise BusinessRuleError(
                    f"Cannot delete tracking {tracking_id}: it is referenced in {transaction_count} transaction(s). "
                    "Transactions are immutable.",
                    details={
                        "tracking_id": tracking_id,
                        "transaction_count": transaction_count
                    }
                )
            
            session.delete(model)
            try:
                session.commit()
                logger.info(f"Successfully deleted tracking {tracking_id}")
                return True
            except IntegrityError as e:
                session.rollback()
                logger.error(
                    f"Failed to delete tracking {tracking_id}: {str(e)}",
                    exc_info=True,
                    extra={"tracking_id": tracking_id}
                )
                raise BusinessRuleError(
                    f"Cannot delete tracking: {str(e)}",
                    details={"tracking_id": tracking_id, "error": str(e)}
                )

