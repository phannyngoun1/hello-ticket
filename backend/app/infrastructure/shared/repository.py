"""
Generic Base SQL Repository implementation.
"""
from typing import Generic, List, Optional, Type, TypeVar, Any, Callable
from datetime import datetime, timezone
from sqlmodel import Session, select, and_
from sqlalchemy.exc import IntegrityError

from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.shared.mapper import BaseMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError

# Type variables
TDomain = TypeVar("TDomain")
TModel = TypeVar("TModel")

class BaseSQLRepository(Generic[TDomain, TModel]):
    """
    Base generic repository implementing common CRUD operations for SQLModel.
    """
    
    def __init__(
        self, 
        model_cls: Type[TModel],
        mapper: BaseMapper[TDomain, TModel],
        session_factory: Optional[Callable[[], Session]] = None,
        tenant_id: Optional[str] = None
    ):
        """
        Initialize the repository.
        
        Args:
            model_cls: The SQLModel class for the database entity
            mapper: Mapper instance to convert between Domain and Model
            session_factory: Function that returns a DB session
            tenant_id: Optional tenant ID override
        """
        self._model_cls = model_cls
        self._mapper = mapper
        self._session_factory = session_factory if session_factory else get_session_sync
        self._tenant_id = tenant_id

    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id

    async def save(self, entity: Any) -> TDomain:
        """Save or update an entity"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if entity exists (assuming 'id' and 'tenant_id' fields exist)
            statement = select(self._model_cls).where(
                self._model_cls.id == entity.id,
                self._model_cls.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                # Update existing
                updated_model = self._mapper.to_model(entity)
                merged_model = session.merge(updated_model)
                try:
                    session.commit()
                    session.refresh(merged_model)
                    return self._mapper.to_domain(merged_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update {self._model_cls.__name__}: {str(e)}")
            else:
                # Create new
                new_model = self._mapper.to_model(entity)
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    return self._mapper.to_domain(new_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create {self._model_cls.__name__}: {str(e)}")

    async def get_by_id(self, tenant_id: str, id: str) -> Optional[TDomain]:
        """Get entity by ID"""
        with self._session_factory() as session:
            # Construct query dynamically to handle optional 'is_deleted' if it exists
            conditions = [
                self._model_cls.id == id,
                self._model_cls.tenant_id == tenant_id
            ]
            
            # Check if model has 'is_deleted' attribute
            if hasattr(self._model_cls, 'is_deleted'):
                conditions.append(self._model_cls.is_deleted == False)
                
            statement = select(self._model_cls).where(and_(*conditions))
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None

    async def delete(self, tenant_id: str, id: str, hard_delete: bool = False) -> bool:
        """Delete an entity"""
        with self._session_factory() as session:
            conditions = [
                self._model_cls.id == id,
                self._model_cls.tenant_id == tenant_id
            ]
            
            if hasattr(self._model_cls, 'is_deleted'):
                conditions.append(self._model_cls.is_deleted == False)
                
            statement = select(self._model_cls).where(and_(*conditions))
            model = session.exec(statement).first()
            
            if not model:
                return False
            
            if hard_delete:
                session.delete(model)
            else:
                if not hasattr(model, 'is_deleted'):
                     # Fallback to hard delete if soft delete not supported
                     session.delete(model)
                else:
                    model.is_deleted = True
                    if hasattr(model, 'deleted_at'):
                        model.deleted_at = datetime.now(timezone.utc)
                    if hasattr(model, 'updated_at'):
                        model.updated_at = datetime.now(timezone.utc)
            
            try:
                session.commit()
                return True
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to delete {self._model_cls.__name__}: {str(e)}")

    async def get_by_ids(self, tenant_id: str, ids: List[str]) -> List[TDomain]:
        """Get entities by list of IDs"""
        if not ids:
            return []
        
        with self._session_factory() as session:
            conditions = [
                self._model_cls.id.in_(ids),
                self._model_cls.tenant_id == tenant_id
            ]
            
            if hasattr(self._model_cls, 'is_deleted'):
                conditions.append(self._model_cls.is_deleted == False)
                
            statement = select(self._model_cls).where(and_(*conditions))
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]

    async def get_all(self, tenant_id: str) -> List[TDomain]:
        """Get all entities for a tenant"""
        with self._session_factory() as session:
            conditions = [self._model_cls.tenant_id == tenant_id]
            if hasattr(self._model_cls, 'is_deleted'):
                conditions.append(self._model_cls.is_deleted == False)
                
            statement = select(self._model_cls).where(and_(*conditions))
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
