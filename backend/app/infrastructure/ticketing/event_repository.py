"""
Event repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_
from app.domain.ticketing.event import Event
from app.domain.ticketing.event_repositories import EventRepository, EventSearchResult
from app.infrastructure.shared.database.models import EventModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.ticketing.mapper_event import EventMapper
from app.infrastructure.shared.repository import BaseSQLRepository


class SQLEventRepository(BaseSQLRepository[Event, EventModel], EventRepository):
    """SQLModel implementation of EventRepository using BaseSQLRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        super().__init__(
            model_cls=EventModel, 
            mapper=EventMapper(), 
            session_factory=session, 
            tenant_id=tenant_id
        )
    
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
        layout_id: Optional[str] = None,
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

            if layout_id:
                conditions.append(EventModel.layout_id == layout_id)
            
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


