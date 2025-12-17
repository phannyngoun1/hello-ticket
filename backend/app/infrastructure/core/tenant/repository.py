"""
Tenant repository implementation - Real database implementation
"""
from datetime import datetime, timezone
from typing import List, Optional
from sqlmodel import Session, select
from app.domain.core.tenant.entity import Tenant
from app.domain.core.tenant.repository import TenantRepository
from app.domain.shared.value_objects.name import Name
from app.infrastructure.shared.database.platform_models import TenantModel
from app.infrastructure.shared.database.platform_connection import get_platform_session_sync


class SQLTenantRepository(TenantRepository):
    """
    Real implementation of TenantRepository with platform database
    
    Uses SQLModel for database operations with the platform database
    """
    
    def __init__(self, session: Optional[Session] = None):
        """
        Initialize repository with optional session
        
        Args:
            session: Optional SQLModel session. If not provided, will create new sessions per operation.
        """
        self._session = session
    
    def _get_session(self) -> Session:
        """Get session - either provided or create new one"""
        if self._session:
            return self._session
        return get_platform_session_sync()
    
    def _domain_to_model(self, tenant: Tenant) -> TenantModel:
        """Convert domain entity to database model"""
        model = TenantModel(
            id=tenant.id,
            name=tenant.name.value,
            slug=tenant.slug,
            is_active=tenant.is_active,
            database_strategy=tenant.database_strategy,
            created_at=tenant.created_at,
            updated_at=tenant.updated_at
        )
        model.set_settings_dict(tenant.settings)
        model.set_database_config_dict(tenant.database_config)
        return model
    
    def _model_to_domain(self, model: TenantModel) -> Tenant:
        """Convert database model to domain entity"""
        return Tenant(
            id=model.id,
            name=Name(model.name),
            slug=model.slug,
            is_active=model.is_active,
            settings=model.get_settings_dict(),
            database_strategy=model.database_strategy,
            database_config=model.get_database_config_dict(),
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    async def save(self, tenant: Tenant) -> Tenant:
        """Save or update a tenant"""
        session = self._get_session()
        needs_close = self._session is None
        
        try:
            # Check if tenant exists
            existing = session.get(TenantModel, tenant.id)
            
            if existing:
                # Update existing tenant
                existing.name = tenant.name.value
                existing.slug = tenant.slug
                existing.is_active = tenant.is_active
                existing.database_strategy = tenant.database_strategy
                existing.set_settings_dict(tenant.settings)
                existing.set_database_config_dict(tenant.database_config)
                existing.updated_at = datetime.now(timezone.utc)
                session.add(existing)
            else:
                # Create new tenant
                model = self._domain_to_model(tenant)
                session.add(model)
            
            session.commit()
            
            # Refresh to get updated data
            if existing:
                session.refresh(existing)
                return self._model_to_domain(existing)
            else:
                model = session.get(TenantModel, tenant.id)
                return self._model_to_domain(model) if model else tenant
        finally:
            if needs_close:
                session.close()
    
    async def get_by_id(self, tenant_id: str) -> Optional[Tenant]:
        """Get tenant by ID"""
        session = self._get_session()
        needs_close = self._session is None
        
        try:
            model = session.get(TenantModel, tenant_id)
            if not model:
                return None
            return self._model_to_domain(model)
        finally:
            if needs_close:
                session.close()
    
    async def get_by_slug(self, slug: str) -> Optional[Tenant]:
        """Get tenant by slug"""
        session = self._get_session()
        needs_close = self._session is None
        
        try:
            statement = select(TenantModel).where(TenantModel.slug == slug)
            result = session.exec(statement)
            model = result.first()
            if not model:
                return None
            return self._model_to_domain(model)
        finally:
            if needs_close:
                session.close()
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Tenant]:
        """Get all tenants with pagination"""
        session = self._get_session()
        needs_close = self._session is None
        
        try:
            statement = select(TenantModel).offset(skip).limit(limit)
            result = session.exec(statement)
            models = result.all()
            return [self._model_to_domain(model) for model in models]
        finally:
            if needs_close:
                session.close()
    
    async def delete(self, tenant_id: str) -> bool:
        """Delete tenant by ID"""
        session = self._get_session()
        needs_close = self._session is None
        
        try:
            model = session.get(TenantModel, tenant_id)
            if not model:
                return False
            session.delete(model)
            session.commit()
            return True
        finally:
            if needs_close:
                session.close()
    
    async def exists_by_slug(self, slug: str) -> bool:
        """Check if tenant exists by slug"""
        session = self._get_session()
        needs_close = self._session is None
        
        try:
            statement = select(TenantModel).where(TenantModel.slug == slug)
            result = session.exec(statement)
            model = result.first()
            return model is not None
        finally:
            if needs_close:
                session.close()

