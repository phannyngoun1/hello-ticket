"""
VenueType repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_, or_
from app.domain.ticketing.venue_type import VenueType
from app.domain.ticketing.venue_type_repositories import VenueTypeRepository, VenueTypeSearchResult
from app.infrastructure.shared.database.models import VenueTypeModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.ticketing.mapper_venue_type import VenueTypeMapper
from app.infrastructure.shared.repository import BaseSQLRepository


class SQLVenueTypeRepository(BaseSQLRepository[VenueType, VenueTypeModel], VenueTypeRepository):
    """SQLModel implementation of VenueTypeRepository using BaseSQLRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        super().__init__(
            model_cls=VenueTypeModel, 
            mapper=VenueTypeMapper(), 
            session_factory=session, 
            tenant_id=tenant_id
        )
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[VenueType]:
        """Get venue_type by business code"""
        if not code or not code.strip():
            return None
        with self._session_factory() as session:
            statement = select(VenueTypeModel).where(
                VenueTypeModel.tenant_id == tenant_id,
                VenueTypeModel.code == code.strip().upper()
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
    ) -> VenueTypeSearchResult:
        """Search venue_types by term and status"""
        with self._session_factory() as session:
            conditions = [VenueTypeModel.tenant_id == tenant_id]
            
            # Exclude deleted records by default
            if not include_deleted:
                conditions.append(VenueTypeModel.is_deleted == False)
            
            if search:
                search_term = f"%{search}%"
                conditions.append(
                    or_(
                        VenueTypeModel.code.ilike(search_term),
                        VenueTypeModel.name.ilike(search_term)
                    )
                )
            
            if is_active is not None:
                conditions.append(VenueTypeModel.is_active == is_active)
            
            # Count total
            count_statement = select(VenueTypeModel).where(and_(*conditions))
            all_models = session.exec(count_statement).all()
            total = len(all_models)
            
            # Get paginated results
            statement = (
                select(VenueTypeModel)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            
            items = [self._mapper.to_domain(model) for model in models]
            has_next = skip + limit < total
            
            return VenueTypeSearchResult(items=items, total=total, has_next=has_next)

