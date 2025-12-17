"""
Item Category repository implementation - Adapter in Hexagonal Architecture
"""
import logging
from typing import List, Optional
from sqlmodel import Session, select, and_, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from app.domain.inventory.repositories import ItemCategoryRepository
from app.domain.inventory.category import ItemCategory
from app.infrastructure.shared.database.models import ItemCategoryModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError, ConflictError
from app.infrastructure.shared.cache.query_cache import cache_query_result

logger = logging.getLogger(__name__)


class SQLItemCategoryRepository(ItemCategoryRepository):
    """SQLModel implementation of ItemCategoryRepository"""
    
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
    
    def _model_to_entity(self, model: ItemCategoryModel) -> ItemCategory:
        """Convert model to domain entity"""
        return ItemCategory(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            category_id=model.id,
            parent_category_id=model.parent_category_id,
            description=model.description,
            level=model.level,
            sort_order=model.sort_order,
            is_active=model.is_active,
            attributes=model.attributes,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def _entity_to_model(self, category: ItemCategory) -> ItemCategoryModel:
        """Convert domain entity to model"""
        return ItemCategoryModel(
            id=category.id,
            tenant_id=category.tenant_id,
            code=category.code,
            name=category.name,
            description=category.description,
            parent_category_id=category.parent_category_id,
            level=category.level,
            sort_order=category.sort_order,
            is_active=category.is_active,
            attributes=category.attributes,
            created_at=category.created_at,
            updated_at=category.updated_at
        )
    
    async def save(self, category: ItemCategory) -> ItemCategory:
        """Save or update a category"""
        tenant_id = self._get_tenant_id()
        
        if category.tenant_id != tenant_id:
            raise BusinessRuleError("Category tenant mismatch")
        
        with self._session_factory() as session:
            try:
                # Check if category exists
                existing_model = session.get(ItemCategoryModel, category.id)
                
                if existing_model:
                    # Update existing
                    existing_model.code = category.code
                    existing_model.name = category.name
                    existing_model.description = category.description
                    existing_model.parent_category_id = category.parent_category_id
                    existing_model.level = category.level
                    existing_model.sort_order = category.sort_order
                    existing_model.is_active = category.is_active
                    existing_model.attributes = category.attributes
                    existing_model.updated_at = category.updated_at
                    session.add(existing_model)
                    session.commit()
                    session.refresh(existing_model)
                    return self._model_to_entity(existing_model)
                else:
                    # Create new
                    model = self._entity_to_model(category)
                    session.add(model)
                    session.commit()
                    session.refresh(model)
                    return self._model_to_entity(model)
            except IntegrityError as e:
                session.rollback()
                if "ix_item_categories_tenant_code" in str(e):
                    raise ConflictError(f"Category code '{category.code}' already exists")
                raise
    
    async def get_by_id(self, category_id: str) -> Optional[ItemCategory]:
        """Get category by ID"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            model = session.get(ItemCategoryModel, category_id)
            if not model or model.tenant_id != tenant_id:
                return None
            return self._model_to_entity(model)
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[ItemCategory]:
        """Get category by code"""
        with self._session_factory() as session:
            stmt = select(ItemCategoryModel).where(
                and_(
                    ItemCategoryModel.tenant_id == tenant_id,
                    ItemCategoryModel.code == code.upper()
                )
            )
            result = session.exec(stmt).first()
            if not result:
                return None
            return self._model_to_entity(result)
    
    async def get_children(self, parent_category_id: str) -> List[ItemCategory]:
        """Get all direct children of a category"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            stmt = select(ItemCategoryModel).where(
                and_(
                    ItemCategoryModel.tenant_id == tenant_id,
                    ItemCategoryModel.parent_category_id == parent_category_id
                )
            ).order_by(ItemCategoryModel.sort_order, ItemCategoryModel.name)
            
            results = session.exec(stmt).all()
            return [self._model_to_entity(model) for model in results]
    
    async def get_descendants(self, category_id: str) -> List[ItemCategory]:
        """Get all descendants of a category (recursive)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Use recursive CTE to get all descendants
            query = text("""
                WITH RECURSIVE category_path AS (
                    SELECT id, tenant_id, code, name, description, parent_category_id,
                           level, sort_order, is_active, attributes, created_at, updated_at
                    FROM item_categories
                    WHERE parent_category_id = :category_id AND tenant_id = :tenant_id
                    
                    UNION ALL
                    
                    SELECT ic.id, ic.tenant_id, ic.code, ic.name, ic.description,
                           ic.parent_category_id, ic.level, ic.sort_order, ic.is_active,
                           ic.attributes, ic.created_at, ic.updated_at
                    FROM item_categories ic
                    INNER JOIN category_path cp ON ic.parent_category_id = cp.id
                    WHERE ic.tenant_id = :tenant_id
                )
                SELECT * FROM category_path
                ORDER BY level, sort_order, name
            """)
            
            result = session.execute(
                query,
                {"category_id": category_id, "tenant_id": tenant_id}
            )
            
            categories = []
            for row in result:
                model = ItemCategoryModel(
                    id=row.id,
                    tenant_id=row.tenant_id,
                    code=row.code,
                    name=row.name,
                    description=row.description,
                    parent_category_id=row.parent_category_id,
                    level=row.level,
                    sort_order=row.sort_order,
                    is_active=row.is_active,
                    attributes=row.attributes,
                    created_at=row.created_at,
                    updated_at=row.updated_at
                )
                categories.append(self._model_to_entity(model))
            
            return categories
    
    async def get_ancestors(self, category_id: str) -> List[ItemCategory]:
        """Get all ancestors of a category (up to root)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Use recursive CTE to get all ancestors
            query = text("""
                WITH RECURSIVE category_path AS (
                    SELECT id, tenant_id, code, name, description, parent_category_id,
                           level, sort_order, is_active, attributes, created_at, updated_at
                    FROM item_categories
                    WHERE id = :category_id AND tenant_id = :tenant_id
                    
                    UNION ALL
                    
                    SELECT ic.id, ic.tenant_id, ic.code, ic.name, ic.description,
                           ic.parent_category_id, ic.level, ic.sort_order, ic.is_active,
                           ic.attributes, ic.created_at, ic.updated_at
                    FROM item_categories ic
                    INNER JOIN category_path cp ON ic.id = cp.parent_category_id
                    WHERE ic.tenant_id = :tenant_id
                )
                SELECT * FROM category_path WHERE id != :category_id
                ORDER BY level DESC
            """)
            
            result = session.execute(
                query,
                {"category_id": category_id, "tenant_id": tenant_id}
            )
            
            categories = []
            for row in result:
                model = ItemCategoryModel(
                    id=row.id,
                    tenant_id=row.tenant_id,
                    code=row.code,
                    name=row.name,
                    description=row.description,
                    parent_category_id=row.parent_category_id,
                    level=row.level,
                    sort_order=row.sort_order,
                    is_active=row.is_active,
                    attributes=row.attributes,
                    created_at=row.created_at,
                    updated_at=row.updated_at
                )
                categories.append(self._model_to_entity(model))
            
            return categories
    
    async def get_root_categories(self, tenant_id: str) -> List[ItemCategory]:
        """Get all root categories (no parent)"""
        with self._session_factory() as session:
            stmt = select(ItemCategoryModel).where(
                and_(
                    ItemCategoryModel.tenant_id == tenant_id,
                    ItemCategoryModel.parent_category_id.is_(None)
                )
            ).order_by(ItemCategoryModel.sort_order, ItemCategoryModel.name)
            
            results = session.exec(stmt).all()
            return [self._model_to_entity(model) for model in results]
    
    async def get_all(
        self,
        tenant_id: str,
        parent_category_id: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[ItemCategory]:
        """Get all categories with filters"""
        with self._session_factory() as session:
            conditions = [ItemCategoryModel.tenant_id == tenant_id]
            
            if parent_category_id is not None:
                conditions.append(ItemCategoryModel.parent_category_id == parent_category_id)
            
            if is_active is not None:
                conditions.append(ItemCategoryModel.is_active == is_active)
            
            stmt = select(ItemCategoryModel).where(
                and_(*conditions)
            ).order_by(ItemCategoryModel.sort_order, ItemCategoryModel.name).offset(skip).limit(limit)
            
            results = session.exec(stmt).all()
            return [self._model_to_entity(model) for model in results]
    
    async def delete(self, category_id: str) -> bool:
        """Delete category by ID (only if no children and no items)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            model = session.get(ItemCategoryModel, category_id)
            if not model or model.tenant_id != tenant_id:
                return False
            
            # Check for children
            children = await self.get_children(category_id)
            if children:
                raise BusinessRuleError("Cannot delete category with children. Delete or move children first.")
            
            # Check for items (would need ItemModel import)
            from app.infrastructure.shared.database.models import ItemModel
            item_stmt = select(ItemModel).where(
                and_(
                    ItemModel.tenant_id == tenant_id,
                    ItemModel.category_id == category_id
                )
            ).limit(1)
            item_result = session.exec(item_stmt).first()
            if item_result:
                raise BusinessRuleError("Cannot delete category with items. Reassign items first.")
            
            session.delete(model)
            session.commit()
            return True
    
    async def get_category_tree(self, tenant_id: str) -> List[ItemCategory]:
        """Get full category tree with hierarchy"""
        # Get all root categories, then recursively build tree
        root_categories = await self.get_root_categories(tenant_id)
        return root_categories

