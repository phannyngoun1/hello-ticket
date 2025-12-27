"""
Event repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_, or_
from sqlalchemy.exc import IntegrityError
from app.domain.ticketing.event import Event
from app.domain.ticketing.event_repositories import EventRepository, EventSearchResult
from app.infrastructure.shared.database.models import EventModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.ticketing.mapper_event import EventMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError


class SQLEventRepository(EventRepository):
    """SQLModel implementation of EventRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._mapper = EventMapper()
        self._tenant_id = tenant_id  # Override tenant context if provided
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, event: Event) -> Event:
        """Save or update a event"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if event exists (within tenant scope)
            statement = select(EventModel).where(
                EventModel.id == event.id,
                EventModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                # Update existing event
                # Use merge with a new model instance to ensure proper change tracking
                updated_model = self._mapper.to_model(event)
                # Merge will update the existing model in the session
                merged_model = session.merge(updated_model)
                try:
                    session.commit()
                    session.refresh(merged_model)
                    return self._mapper.to_domain(merged_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update event: {str(e)}")
            else:
                # Create new event
                new_model = self._mapper.to_model(event)
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    return self._mapper.to_domain(new_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create event: {str(e)}")
    
    async def get_by_id(self, tenant_id: str, event_id: str) -> Optional[Event]:
        """Get event by ID (within tenant scope)"""
        with self._session_factory() as session:
            statement = select(EventModel).where(
                EventModel.id == event_id,
                EventModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Event]:
        """Get event by business code - deprecated, events no longer have codes"""
        # Events no longer have code fields, return None
        return None
    
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        show_id: Optional[str] = None,
        include_deleted: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> EventSearchResult:
        """Search events by term and status"""
        with self._session_factory() as session:
            conditions = [EventModel.tenant_id == tenant_id]
            
            # Exclude deleted records by default
            if not include_deleted:
                conditions.append(EventModel.is_deleted == False)
            
            if search:
                search_term = f"%{search}%"
                conditions.append(
                    EventModel.title.ilike(search_term)
                )
            
            if is_active is not None:
                conditions.append(EventModel.is_active == is_active)
            
            if show_id:
                conditions.append(EventModel.show_id == show_id)
            
            # Count total
            count_statement = select(EventModel).where(and_(*conditions))
            all_models = session.exec(count_statement).all()
            total = len(all_models)
            
            # Get paginated results
            statement = (
                select(EventModel)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            
            items = [self._mapper.to_domain(model) for model in models]
            has_next = skip + limit < total
            
            return EventSearchResult(items=items, total=total, has_next=has_next)
    
    async def get_all(self, tenant_id: str) -> List[Event]:
        """Get all events for a tenant"""
        with self._session_factory() as session:
            statement = select(EventModel).where(
                EventModel.tenant_id == tenant_id
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def delete(self, tenant_id: str, event_id: str, hard_delete: bool = False) -> bool:
        """Delete a event (soft-delete by default, hard-delete if specified)"""
        with self._session_factory() as session:
            statement = select(EventModel).where(
                EventModel.id == event_id,
                EventModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            if not model:
                return False
            
            if hard_delete:
                # Hard delete: permanently remove from database
                session.delete(model)
            else:
                # Soft delete: mark as deleted
                from datetime import datetime, timezone
                model.is_deleted = True
                model.deleted_at = datetime.now(timezone.utc)
                model.updated_at = datetime.now(timezone.utc)
                # Model is already in session from .first(), SQLAlchemy tracks changes automatically
            
            try:
                session.commit()
                return True
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to delete event: {str(e)}")

