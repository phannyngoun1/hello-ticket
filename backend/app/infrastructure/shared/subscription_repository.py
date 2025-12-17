"""
Subscription repository implementation - Real database implementation
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from sqlmodel import Session, select
from app.shared.utils import generate_id
from app.infrastructure.shared.database.platform_models import TenantSubscriptionModel
from app.infrastructure.shared.database.platform_connection import get_platform_session_sync


class SubscriptionRepository:
    """
    Repository for tenant subscriptions - Real database implementation
    
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
    
    def _model_to_dict(self, model: TenantSubscriptionModel) -> Dict[str, Any]:
        """Convert database model to dictionary"""
        return {
            'id': model.id,
            'tenant_id': model.tenant_id,
            'plan_tier': model.plan_tier,
            'billing_cycle': model.billing_cycle,
            'status': model.status,
            'is_locked': model.is_locked,
            'created_at': model.created_at,
            'updated_at': model.updated_at
        }
    
    def _dict_to_model(self, data: Dict[str, Any]) -> TenantSubscriptionModel:
        """Convert dictionary to database model"""
        return TenantSubscriptionModel(**data)
    
    async def get_by_tenant(self, tenant_id: str) -> Optional[Dict[str, Any]]:
        """Get subscription by tenant ID"""
        session = self._get_session()
        needs_close = self._session is None
        
        try:
            statement = select(TenantSubscriptionModel).where(TenantSubscriptionModel.tenant_id == tenant_id)
            result = session.exec(statement)
            model = result.first()
            if not model:
                return None
            return self._model_to_dict(model)
        finally:
            if needs_close:
                session.close()
    
    async def get_by_id(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        """Get subscription by ID"""
        session = self._get_session()
        needs_close = self._session is None
        
        try:
            model = session.get(TenantSubscriptionModel, subscription_id)
            if not model:
                return None
            return self._model_to_dict(model)
        finally:
            if needs_close:
                session.close()
    
    async def create(self, subscription_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new subscription"""
        session = self._get_session()
        needs_close = self._session is None
        
        try:
            if not subscription_data.get('id'):
                subscription_data['id'] = generate_id()
            
            subscription_data['created_at'] = datetime.now(timezone.utc)
            subscription_data['updated_at'] = datetime.now(timezone.utc)
            
            model = self._dict_to_model(subscription_data)
            session.add(model)
            session.commit()
            session.refresh(model)
            return self._model_to_dict(model)
        finally:
            if needs_close:
                session.close()
    
    async def save(self, subscription_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save or update subscription"""
        session = self._get_session()
        needs_close = self._session is None
        
        try:
            subscription_data['updated_at'] = datetime.now(timezone.utc)
            
            # Check if exists
            subscription_id = subscription_data.get('id')
            if subscription_id:
                existing = session.get(TenantSubscriptionModel, subscription_id)
                if existing:
                    # Update existing
                    for key, value in subscription_data.items():
                        setattr(existing, key, value)
                    session.add(existing)
                    session.commit()
                    session.refresh(existing)
                    return self._model_to_dict(existing)
            
            # Create new
            model = self._dict_to_model(subscription_data)
            session.add(model)
            session.commit()
            session.refresh(model)
            return self._model_to_dict(model)
        finally:
            if needs_close:
                session.close()
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all subscriptions with pagination"""
        session = self._get_session()
        needs_close = self._session is None
        
        try:
            statement = select(TenantSubscriptionModel).offset(skip).limit(limit)
            result = session.exec(statement)
            models = result.all()
            return [self._model_to_dict(model) for model in models]
        finally:
            if needs_close:
                session.close()
    
    async def count_by_plan(self, plan_tier: str) -> int:
        """Count subscriptions by plan tier"""
        session = self._get_session()
        needs_close = self._session is None
        
        try:
            statement = select(TenantSubscriptionModel).where(TenantSubscriptionModel.plan_tier == plan_tier)
            result = session.exec(statement)
            models = result.all()
            return len(models)
        finally:
            if needs_close:
                session.close()
    
    async def get_locked_subscriptions(self) -> List[Dict[str, Any]]:
        """Get all locked subscriptions"""
        session = self._get_session()
        needs_close = self._session is None
        
        try:
            statement = select(TenantSubscriptionModel).where(TenantSubscriptionModel.is_locked == True)
            result = session.exec(statement)
            models = result.all()
            return [self._model_to_dict(model) for model in models]
        finally:
            if needs_close:
                session.close()
    
    async def create_default_subscription(self, tenant_id: str) -> Dict[str, Any]:
        """Create default free subscription for new tenant"""
        subscription_data = {
            'id': generate_id(),
            'tenant_id': tenant_id,
            'plan_tier': 'free',
            'billing_cycle': 'monthly',
            'status': 'active',
            'is_locked': False
        }
        return await self.create(subscription_data)

