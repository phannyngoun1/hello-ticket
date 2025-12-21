"""
Layout repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_
from sqlalchemy.exc import IntegrityError
from app.domain.ticketing.layout import Layout
from app.domain.ticketing.layout_repositories import LayoutRepository
from app.infrastructure.shared.database.models import LayoutModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.ticketing.mapper_layout import LayoutMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError


class SQLLayoutRepository(LayoutRepository):
    """SQLModel implementation of LayoutRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._mapper = LayoutMapper()
        self._tenant_id = tenant_id
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, layout: Layout) -> Layout:
        """Save or update a layout"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(LayoutModel).where(
                LayoutModel.id == layout.id,
                LayoutModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                updated_model = self._mapper.to_model(layout)
                merged_model = session.merge(updated_model)
                try:
                    session.commit()
                    session.refresh(merged_model)
                    return self._mapper.to_domain(merged_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update layout: {str(e)}")
            else:
                new_model = self._mapper.to_model(layout)
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    return self._mapper.to_domain(new_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create layout: {str(e)}")
    
    async def get_by_id(self, tenant_id: str, layout_id: str) -> Optional[Layout]:
        """Get layout by ID (within tenant scope)"""
        with self._session_factory() as session:
            statement = select(LayoutModel).where(
                LayoutModel.id == layout_id,
                LayoutModel.tenant_id == tenant_id,
                LayoutModel.is_deleted == False
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_venue_id(self, tenant_id: str, venue_id: str) -> List[Layout]:
        """Get all layouts for a venue"""
        with self._session_factory() as session:
            statement = select(LayoutModel).where(
                LayoutModel.tenant_id == tenant_id,
                LayoutModel.venue_id == venue_id,
                LayoutModel.is_deleted == False
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def delete(self, tenant_id: str, layout_id: str) -> None:
        """Delete a layout (soft delete)"""
        with self._session_factory() as session:
            statement = select(LayoutModel).where(
                LayoutModel.id == layout_id,
                LayoutModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            if not model:
                return
            
            from datetime import datetime, timezone
            model.is_deleted = True
            model.deleted_at = datetime.now(timezone.utc)
            model.updated_at = datetime.now(timezone.utc)
            
            try:
                session.commit()
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to delete layout: {str(e)}")
