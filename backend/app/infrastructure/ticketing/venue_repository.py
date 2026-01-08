"""
Venue repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_
from app.domain.ticketing.venue import Venue
from app.domain.ticketing.venue_repositories import VenueRepository, VenueSearchResult
from app.infrastructure.shared.database.models import VenueModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.ticketing.mapper_venue import VenueMapper
from app.infrastructure.shared.repository import BaseSQLRepository


class SQLVenueRepository(BaseSQLRepository[Venue, VenueModel], VenueRepository):
    """SQLModel implementation of VenueRepository using BaseSQLRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        super().__init__(
            model_cls=VenueModel, 
            mapper=VenueMapper(), 
            session_factory=session, 
            tenant_id=tenant_id
        )
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Venue]:
        """Get venue by business code"""
        if not code or not code.strip():
            return None
        with self._session_factory() as session:
            statement = select(VenueModel).where(
                VenueModel.tenant_id == tenant_id,
                VenueModel.code == code.strip().upper()
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
    ) -> VenueSearchResult:
        """Search venues by term and status"""
        with self._session_factory() as session:
            conditions = [VenueModel.tenant_id == tenant_id]
            
            # Exclude deleted records by default
            if not include_deleted:
                conditions.append(VenueModel.is_deleted == False)
            
            if search:
                search_term = f"%{search}%"
                conditions.append(
                    VenueModel.name.ilike(search_term) | VenueModel.code.ilike(search_term)
                )
            
            if is_active is not None:
                conditions.append(VenueModel.is_active == is_active)
            
            # Count total
            count_statement = select(VenueModel).where(and_(*conditions))
            all_models = session.exec(count_statement).all()
            total = len(all_models)
            
            # Get paginated results
            statement = (
                select(VenueModel)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            
            items = [self._mapper.to_domain(model) for model in models]
            has_next = skip + limit < total
            
            return VenueSearchResult(items=items, total=total, has_next=has_next)

