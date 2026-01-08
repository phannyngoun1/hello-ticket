"""
Ticket repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_
from sqlalchemy.exc import IntegrityError
from app.domain.ticketing.ticket import Ticket
from app.domain.ticketing.ticket_repositories import TicketRepository
from app.infrastructure.shared.database.models import TicketModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.ticketing.mapper_ticket import TicketMapper
from app.infrastructure.shared.repository import BaseSQLRepository
from app.shared.exceptions import BusinessRuleError


class SQLTicketRepository(BaseSQLRepository[Ticket, TicketModel], TicketRepository):
    """SQLModel implementation of TicketRepository using BaseSQLRepository"""

    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        super().__init__(
            model_cls=TicketModel, 
            mapper=TicketMapper(), 
            session_factory=session, 
            tenant_id=tenant_id
        )

    async def get_by_ticket_number(self, tenant_id: str, ticket_number: str) -> Optional[Ticket]:
        """Get ticket by ticket number"""
        with self._session_factory() as session:
            statement = select(TicketModel).where(
                and_(
                    TicketModel.ticket_number == ticket_number,
                    TicketModel.tenant_id == tenant_id
                )
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None

    async def get_by_event_seat(self, tenant_id: str, event_seat_id: str) -> Optional[Ticket]:
        """Get ticket by event seat ID"""
        with self._session_factory() as session:
            statement = select(TicketModel).where(
                and_(
                    TicketModel.event_seat_id == event_seat_id,
                    TicketModel.tenant_id == tenant_id
                )
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None

    async def get_by_event(self, tenant_id: str, event_id: str, skip: int = 0, limit: int = 100) -> tuple[List[Ticket], int]:
        """Get tickets for an event with pagination. Returns (tickets, total_count)"""
        with self._session_factory() as session:
            base_statement = select(TicketModel).where(
                and_(
                    TicketModel.tenant_id == tenant_id,
                    TicketModel.event_id == event_id
                )
            )
            
            # Get total count
            total_count = len(session.exec(base_statement).all())
            
            # Get paginated results
            paginated_statement = base_statement.offset(skip).limit(limit)
            models = session.exec(paginated_statement).all()
            
            tickets = [self._mapper.to_domain(m) for m in models]
            return tickets, total_count

    async def get_by_booking(self, tenant_id: str, booking_id: str) -> List[Ticket]:
        """Get all tickets for a booking"""
        with self._session_factory() as session:
            statement = select(TicketModel).where(
                and_(
                    TicketModel.tenant_id == tenant_id,
                    TicketModel.booking_id == booking_id
                )
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(m) for m in models]

    async def save_all(self, tickets: List[Ticket]) -> List[Ticket]:
        """Save multiple tickets (create or update)"""
        tenant_id = self._get_tenant_id()
        if not tickets:
            return []

        with self._session_factory() as session:
            # Get all IDs to check which ones exist
            ticket_ids = [ticket.id for ticket in tickets]
            existing_statement = select(TicketModel).where(
                and_(
                    TicketModel.id.in_(ticket_ids),
                    TicketModel.tenant_id == tenant_id
                )
            )
            existing_models = {m.id: m for m in session.exec(existing_statement).all()}
            
            models = []
            for domain in tickets:
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
                # Re-query all models in a single bulk query to get updated data
                # This is much more efficient than individual queries
                refreshed_statement = select(TicketModel).where(
                    and_(
                        TicketModel.id.in_(ticket_ids),
                        TicketModel.tenant_id == tenant_id
                    )
                )
                refreshed_models = session.exec(refreshed_statement).all()
                # Create a map for quick lookup
                refreshed_map = {m.id: m for m in refreshed_models}
                # Return in the same order as input
                return [self._mapper.to_domain(refreshed_map[ticket.id]) for ticket in tickets if ticket.id in refreshed_map]
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to bulk save tickets: {str(e)}")

