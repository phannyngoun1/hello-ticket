"""
Event repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_, or_
from app.domain.ticketing.event import Event
from app.domain.ticketing.event_repositories import EventRepository, EventSearchResult
from app.infrastructure.shared.database.models import EventModel, ShowModel, VenueModel, OrganizerModel
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
        status: Optional[List[str]] = None,
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
                # Fuzzy search across multiple fields using OR conditions
                search_conditions = [
                    EventModel.title.ilike(search_term),  # Event title
                    EventModel.id.ilike(search_term),     # Event ID/code
                    ShowModel.name.ilike(search_term),    # Show name
                    ShowModel.code.ilike(search_term),    # Show code
                    VenueModel.name.ilike(search_term),   # Venue name
                    VenueModel.code.ilike(search_term),   # Venue code
                    VenueModel.city.ilike(search_term),   # Venue city
                    VenueModel.state_province.ilike(search_term),  # Venue state
                    OrganizerModel.name.ilike(search_term),  # Organizer name
                    OrganizerModel.code.ilike(search_term),  # Organizer code
                ]
                conditions.append(or_(*search_conditions))
            
            if is_active is not None:
                conditions.append(EventModel.is_active == is_active)
            
            if show_id:
                conditions.append(EventModel.show_id == show_id)

            if layout_id:
                conditions.append(EventModel.layout_id == layout_id)

            if status:
                if len(status) == 1:
                    conditions.append(EventModel.status == status[0])
                else:
                    conditions.append(EventModel.status.in_(status))
            
            # Count total with JOINs for search
            count_statement = (
                select(EventModel)
                .join(ShowModel, EventModel.show_id == ShowModel.id)
                .join(VenueModel, EventModel.venue_id == VenueModel.id)
                .join(OrganizerModel, ShowModel.organizer_id == OrganizerModel.id)
                .where(and_(*conditions))
            )
            all_models = session.exec(count_statement).all()
            total = len(all_models)

            # Get paginated results with JOINs
            statement = (
                select(EventModel)
                .join(ShowModel, EventModel.show_id == ShowModel.id)
                .join(VenueModel, EventModel.venue_id == VenueModel.id)
                .join(OrganizerModel, ShowModel.organizer_id == OrganizerModel.id)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            
            items = [self._mapper.to_domain(model) for model in models]
            has_next = skip + limit < total
            
            return EventSearchResult(items=items, total=total, has_next=has_next)


