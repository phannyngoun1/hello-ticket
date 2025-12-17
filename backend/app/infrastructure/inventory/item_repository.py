"""
Item repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_, or_
from sqlalchemy.exc import IntegrityError
from app.domain.inventory.item import Item
from app.domain.inventory.repositories import ItemRepository
from app.infrastructure.shared.database.models import ItemModel
from app.shared.enums import ItemTypeEnum, ItemUsageEnum, TrackingScopeEnum
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.inventory.mapper import ItemMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError
from app.infrastructure.shared.cache.query_cache import cache_query_result
from app.infrastructure.shared.monitoring.query_performance import monitor_query_performance


class SQLItemRepository(ItemRepository):
    """SQLModel implementation of ItemRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._mapper = ItemMapper()
        self._tenant_id = tenant_id  # Override tenant context if provided
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, item: Item) -> Item:
        """Save or update an item"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if item exists (within tenant scope)
            statement = select(ItemModel).where(
                ItemModel.id == item.id,
                ItemModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                # Update existing item
                existing_model.sku = item.sku
                existing_model.code = item.code
                existing_model.name = item.name
                existing_model.description = item.description
                existing_model.item_group = item.item_group
                existing_model.category_id = item.category_id if hasattr(item, 'category_id') else None
                existing_model.item_type = item.item_type if hasattr(item, 'item_type') else ItemTypeEnum.PRODUCT.value
                existing_model.item_usage = item.item_usage if hasattr(item, 'item_usage') else ItemUsageEnum.FOR_SALE.value
                existing_model.tracking_scope = item.tracking_scope if hasattr(item, 'tracking_scope') else TrackingScopeEnum.BOTH.value
                existing_model.default_uom = item.default_uom
                existing_model.tracking_requirements = item.tracking_requirements if hasattr(item, 'tracking_requirements') else []
                existing_model.perishable = item.perishable
                existing_model.active = item.active
                existing_model.attributes = item.attributes
                existing_model.updated_at = item.updated_at
                
                # Apply UoM mappings
                self._mapper.apply_to_model(item, existing_model, session)
                
                session.add(existing_model)
                try:
                    session.commit()
                    session.refresh(existing_model)
                    return self._mapper.to_domain(existing_model, session)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update item: {str(e)}")
            else:
                # Create new item
                new_model = self._mapper.to_model(item, session)
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    # Save UoM mappings for new item
                    uom_mappings = item.attributes.get("uom_mappings") if item.attributes else None
                    if uom_mappings:
                        self._mapper._save_uom_mappings(session, tenant_id, item.id, uom_mappings)
                        session.commit()
                    return self._mapper.to_domain(new_model, session)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create item: {str(e)}")
            
            # Invalidate cache after save
            from app.infrastructure.shared.cache.query_cache import invalidate_query_cache
            invalidate_query_cache("item", tenant_id=tenant_id, item_id=item.id)
    
    @cache_query_result(ttl=3600, key_prefix="item")  # Cache for 1 hour
    @monitor_query_performance(threshold_ms=100)
    async def get_by_id(self, item_id: str) -> Optional[Item]:
        """Get item by ID (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(ItemModel).where(
                ItemModel.id == item_id,
                ItemModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model, session) if model else None
    
    @cache_query_result(ttl=3600, key_prefix="item")
    @monitor_query_performance(threshold_ms=100)
    async def get_by_sku(self, tenant_id: str, sku: str) -> Optional[Item]:
        """Get item by SKU (only works for items with SKU)"""
        if not sku or not sku.strip():
            return None
        with self._session_factory() as session:
            statement = select(ItemModel).where(
                ItemModel.tenant_id == tenant_id,
                ItemModel.sku == sku.upper().strip()
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model, session) if model else None

    @cache_query_result(ttl=3600, key_prefix="item")
    @monitor_query_performance(threshold_ms=100)
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Item]:
        """Get item by ERP code (only works for items with code)"""
        if not code or not code.strip():
            return None
        with self._session_factory() as session:
            statement = select(ItemModel).where(
                ItemModel.tenant_id == tenant_id,
                ItemModel.code == code.upper().strip()
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model, session) if model else None
    
    async def get_all(
        self,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = False
    ) -> List[Item]:
        """Get all items with pagination"""
        with self._session_factory() as session:
            conditions = [ItemModel.tenant_id == tenant_id]
            
            if active_only:
                conditions.append(ItemModel.active == True)
            
            statement = (
                select(ItemModel)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model, session) for model in models]
    
    @cache_query_result(ttl=300, key_prefix="item")  # Cache for 5 minutes (search queries)
    @monitor_query_performance(threshold_ms=200)
    async def search(
        self,
        tenant_id: str,
        query: str,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = False
    ) -> List[Item]:
        """Search items by code, name, SKU, or description"""
        search_term = f"%{query}%"
        
        with self._session_factory() as session:
            # Search by code, name, SKU (if not null), or description (if not null)
            conditions = [
                    ItemModel.tenant_id == tenant_id,
                    or_(
                        ItemModel.name.ilike(search_term),
                        and_(
                            ItemModel.code.isnot(None),
                            ItemModel.code.ilike(search_term)
                        ),
                        and_(
                            ItemModel.sku.isnot(None),
                            ItemModel.sku.ilike(search_term)
                        ),
                        and_(
                            ItemModel.description.isnot(None),
                            ItemModel.description.ilike(search_term)
                        )
                    )
            ]
            
            if active_only:
                conditions.append(ItemModel.active == True)
            
            statement = (
                select(ItemModel)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model, session) for model in models]
    
    async def get_by_group(
        self,
        tenant_id: str,
        item_group: str
    ) -> List[Item]:
        """Get all items in a group"""
        with self._session_factory() as session:
            statement = select(ItemModel).where(
                ItemModel.tenant_id == tenant_id,
                ItemModel.item_group == item_group
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model, session) for model in models]
    
    async def delete(self, item_id: str) -> bool:
        """Delete item by ID (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(ItemModel).where(
                ItemModel.id == item_id,
                ItemModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            if model:
                # Delete associated UoM mappings
                from app.infrastructure.shared.database.models import ItemUoMMappingModel
                mapping_statement = select(ItemUoMMappingModel).where(
                    ItemUoMMappingModel.item_id == item_id,
                    ItemUoMMappingModel.tenant_id == tenant_id
                )
                mappings = session.exec(mapping_statement).all()
                for mapping in mappings:
                    session.delete(mapping)
                
                session.delete(model)
                try:
                    session.commit()
                    return True
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to delete item: {str(e)}")
            return False

