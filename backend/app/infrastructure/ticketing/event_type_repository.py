"""
EventType repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_, or_
from app.domain.ticketing.event_type import EventType
from app.domain.ticketing.event_type_repositories import EventTypeRepository, EventTypeSearchResult
from app.infrastructure.shared.database.models import EventTypeModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.ticketing.mapper_event_type import EventTypeMapper
from app.infrastructure.shared.repository import BaseSQLRepository


class SQLEventTypeRepository(BaseSQLRepository[EventType, EventTypeModel], EventTypeRepository):
    """SQLModel implementation of EventTypeRepository using BaseSQLRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        super().__init__(
            model_cls=EventTypeModel, 
            mapper=EventTypeMapper(), 
            session_factory=session, 
            tenant_id=tenant_id
        )
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[EventType]:
        """Get event_type by business code"""
        if not code or not code.strip():
            return None
        with self._session_factory() as session:
            statement = select(EventTypeModel).where(
                EventTypeModel.tenant_id == tenant_id,
                EventTypeModel.code == code.strip().upper()
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        include_deleted: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> EventTypeSearchResult:
        """Search event_types by term and status"""
        with self._session_factory() as session:
            conditions = [EventTypeModel.tenant_id == tenant_id]
            
            # Exclude deleted records by default
            if not include_deleted:
                conditions.append(EventTypeModel.is_deleted == False)
            
            if search:
                search_term = f"%{search}%"
                conditions.append(
                    or_(
                        EventTypeModel.code.ilike(search_term),
                        EventTypeModel.name.ilike(search_term)
                    )
                )
            
            if is_active is not None:
                conditions.append(EventTypeModel.is_active == is_active)
            
            # Count total
            count_statement = select(EventTypeModel).where(and_(*conditions))
            all_models = session.exec(count_statement).all()
            total = len(all_models)
            
            # Get paginated results
            statement = (
                select(EventTypeModel)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            
            items = [self._mapper.to_domain(model) for model in models]
            has_next = skip + limit < total
            
            return EventTypeSearchResult(items=items, total=total, has_next=has_next)

