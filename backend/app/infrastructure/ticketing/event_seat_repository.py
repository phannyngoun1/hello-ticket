"""
EventSeat repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_
from sqlalchemy.exc import IntegrityError
from app.domain.ticketing.event_seat import EventSeat
from app.domain.ticketing.event_seat_repositories import EventSeatRepository, EventSeatSearchResult
from app.infrastructure.shared.database.models import EventSeatModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.ticketing.mapper_event_seat import EventSeatMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError


class SQLEventSeatRepository(EventSeatRepository):
    """SQLModel implementation of EventSeatRepository"""

    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._mapper = EventSeatMapper()
        self._tenant_id = tenant_id  # Override tenant context if provided

    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id

    async def save(self, event_seat: EventSeat) -> EventSeat:
        """Save or update an event seat"""
        tenant_id = self._get_tenant_id()

        with self._session_factory() as session:
            statement = select(EventSeatModel).where(
                EventSeatModel.id == event_seat.id,
                EventSeatModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()

            if existing_model:
                updated_model = self._mapper.to_model(event_seat)
                merged_model = session.merge(updated_model)
                try:
                    session.commit()
                    session.refresh(merged_model)
                    return self._mapper.to_domain(merged_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update event seat: {str(e)}")
            else:
                new_model = self._mapper.to_model(event_seat)
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    return self._mapper.to_domain(new_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create event seat: {str(e)}")

    async def save_all(self, event_seats: List[EventSeat]) -> List[EventSeat]:
        """Bulk save event seats (create or update)"""
        tenant_id = self._get_tenant_id()
        if not event_seats:
            return []

        with self._session_factory() as session:
            # Get all IDs to check which ones exist
            seat_ids = [seat.id for seat in event_seats]
            existing_statement = select(EventSeatModel).where(
                and_(
                    EventSeatModel.id.in_(seat_ids),
                    EventSeatModel.tenant_id == tenant_id,
                    EventSeatModel.is_deleted == False  # Only check non-deleted records
                )
            )
            existing_models = {m.id: m for m in session.exec(existing_statement).all()}
            
            models = []
            for domain in event_seats:
                model = self._mapper.to_model(domain)
                model.tenant_id = tenant_id  # Ensure tenant consistency
                
                # Use merge for existing records, add for new ones
                if domain.id in existing_models:
                    merged_model = session.merge(model)
                    models.append(merged_model)
                else:
                    session.add(model)
                    models.append(model)
            
            try:
                session.commit()
                # Refresh all models to get updated data
                for model in models:
                    session.refresh(model)
                return [self._mapper.to_domain(m) for m in models]
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to bulk save event seats: {str(e)}")

    async def get_by_id(self, tenant_id: str, event_seat_id: str) -> Optional[EventSeat]:
        """Get event seat by ID"""
        with self._session_factory() as session:
            statement = select(EventSeatModel).where(
                and_(
                    EventSeatModel.id == event_seat_id,
                    EventSeatModel.tenant_id == tenant_id,
                    EventSeatModel.is_deleted == False  # Only return non-deleted records
                )
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None

    async def get_by_event(
        self,
        tenant_id: str,
        event_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> EventSeatSearchResult:
        """Get seats for an event"""
        with self._session_factory() as session:
            base_query = select(EventSeatModel).where(
                and_(
                    EventSeatModel.tenant_id == tenant_id,
                    EventSeatModel.event_id == event_id,
                    EventSeatModel.is_deleted == False  # Only return non-deleted records
                )
            )
            
            # Count total
            total = len(session.exec(base_query).all())
            
            # Paginated query
            statement = base_query.offset(skip).limit(limit)
            models = session.exec(statement).all()
            
            items = [self._mapper.to_domain(model) for model in models]
            has_next = skip + limit < total
            
            return EventSeatSearchResult(items=items, total=total, has_next=has_next)

    async def delete_by_event(self, tenant_id: str, event_id: str) -> int:
        """Delete all seats for an event (and their associated tickets)"""
        from app.infrastructure.shared.database.models import TicketModel
        from sqlalchemy import delete as sql_delete
        
        with self._session_factory() as session:
            # First, get all event seat IDs
            statement = select(EventSeatModel).where(
                and_(
                    EventSeatModel.tenant_id == tenant_id,
                    EventSeatModel.event_id == event_id
                )
            )
            models = session.exec(statement).all()
            event_seat_ids = [model.id for model in models]
            count = len(models)
            
            if not event_seat_ids:
                return 0
            
            try:
                # Delete associated tickets first using bulk delete
                ticket_delete_stmt = sql_delete(TicketModel).where(
                    and_(
                        TicketModel.tenant_id == tenant_id,
                        TicketModel.event_seat_id.in_(event_seat_ids)
                    )
                )
                session.execute(ticket_delete_stmt)
                session.flush()  # Ensure tickets are deleted before seats
                
                # Then delete event seats using bulk delete
                seat_delete_stmt = sql_delete(EventSeatModel).where(
                    and_(
                        EventSeatModel.tenant_id == tenant_id,
                        EventSeatModel.event_id == event_id
                    )
                )
                session.execute(seat_delete_stmt)
                
                session.commit()
                return count
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to delete event seats: {str(e)}")

    async def delete(self, tenant_id: str, event_id: str, event_seat_ids: List[str]) -> int:
        """Delete specific event seats by their IDs (and their associated tickets)"""
        from app.infrastructure.shared.database.models import TicketModel
        from sqlalchemy import delete as sql_delete
        
        if not event_seat_ids:
            return 0
        
        with self._session_factory() as session:
            # Verify seats exist and belong to the event
            statement = select(EventSeatModel).where(
                and_(
                    EventSeatModel.tenant_id == tenant_id,
                    EventSeatModel.event_id == event_id,
                    EventSeatModel.id.in_(event_seat_ids),
                    EventSeatModel.is_deleted == False  # Only check non-deleted records
                )
            )
            models = session.exec(statement).all()
            count = len(models)
            
            if not models:
                return 0
            
            # Get the IDs of seats that will be deleted
            seat_ids_to_delete = [model.id for model in models]
            
            try:
                # Delete associated tickets first using bulk delete
                ticket_delete_stmt = sql_delete(TicketModel).where(
                    and_(
                        TicketModel.tenant_id == tenant_id,
                        TicketModel.event_seat_id.in_(seat_ids_to_delete)
                    )
                )
                session.execute(ticket_delete_stmt)
                session.flush()  # Ensure tickets are deleted before seats
                
                # Then delete event seats using bulk delete
                seat_delete_stmt = sql_delete(EventSeatModel).where(
                    and_(
                        EventSeatModel.tenant_id == tenant_id,
                        EventSeatModel.event_id == event_id,
                        EventSeatModel.id.in_(seat_ids_to_delete)
                    )
                )
                session.execute(seat_delete_stmt)
                
                session.commit()
                return count
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to delete event seats: {str(e)}")

    async def get_seat_by_location(
        self,
        tenant_id: str,
        event_id: str,
        section_name: str,
        row_name: str,
        seat_number: str
    ) -> Optional[EventSeat]:
        """Find seat by location"""
        with self._session_factory() as session:
            statement = select(EventSeatModel).where(
                and_(
                    EventSeatModel.tenant_id == tenant_id,
                    EventSeatModel.event_id == event_id,
                    EventSeatModel.section_name == section_name,
                    EventSeatModel.row_name == row_name,
                    EventSeatModel.seat_number == seat_number,
                    EventSeatModel.is_deleted == False  # Only return non-deleted records
                )
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
