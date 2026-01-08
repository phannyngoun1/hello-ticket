"""
Layout repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_
from app.domain.ticketing.layout import Layout
from app.domain.ticketing.layout_repositories import LayoutRepository
from app.infrastructure.shared.database.models import LayoutModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.ticketing.mapper_layout import LayoutMapper
from app.infrastructure.shared.repository import BaseSQLRepository


class SQLLayoutRepository(BaseSQLRepository[Layout, LayoutModel], LayoutRepository):
    """SQLModel implementation of LayoutRepository using BaseSQLRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        super().__init__(
            model_cls=LayoutModel, 
            mapper=LayoutMapper(), 
            session_factory=session, 
            tenant_id=tenant_id
        )
    
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
