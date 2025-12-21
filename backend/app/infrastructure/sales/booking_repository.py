"""
Booking repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_, or_
from sqlalchemy.exc import IntegrityError
from app.domain.sales.booking import Booking
from app.domain.sales.booking_repositories import BookingRepository, BookingSearchResult
from app.infrastructure.shared.database.models import BookingModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.sales.mapper_booking import BookingMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError


class SQLBookingRepository(BookingRepository):
    """SQLModel implementation of BookingRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._mapper = BookingMapper()
        self._tenant_id = tenant_id  # Override tenant context if provided
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, booking: Booking) -> Booking:
        """Save or update a booking"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if booking exists (within tenant scope)
            statement = select(BookingModel).where(
                BookingModel.id == booking.id,
                BookingModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                # Update existing booking
                # Use merge with a new model instance to ensure proper change tracking
                updated_model = self._mapper.to_model(booking)
                # Merge will update the existing model in the session
                merged_model = session.merge(updated_model)
                try:
                    session.commit()
                    session.refresh(merged_model)
                    return self._mapper.to_domain(merged_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update booking: {str(e)}")
            else:
                # Create new booking
                new_model = self._mapper.to_model(booking)
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    return self._mapper.to_domain(new_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create booking: {str(e)}")
    
    async def get_by_id(self, tenant_id: str, booking_id: str) -> Optional[Booking]:
        """Get booking by ID (within tenant scope)"""
        with self._session_factory() as session:
            statement = select(BookingModel).where(
                BookingModel.id == booking_id,
                BookingModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Booking]:
        """Get booking by business code"""
        if not code or not code.strip():
            return None
        with self._session_factory() as session:
            statement = select(BookingModel).where(
                BookingModel.tenant_id == tenant_id,
                BookingModel.code == code.strip().upper()
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
    ) -> BookingSearchResult:
        """Search bookings by term and status"""
        with self._session_factory() as session:
            conditions = [BookingModel.tenant_id == tenant_id]
            
            # Exclude deleted records by default
            if not include_deleted:
                conditions.append(BookingModel.is_deleted == False)
            
            if search:
                search_term = f"%{search}%"
                conditions.append(
                    or_(
                        BookingModel.code.ilike(search_term),
                        BookingModel.name.ilike(search_term)
                    )
                )
            
            if is_active is not None:
                conditions.append(BookingModel.is_active == is_active)
            
            # Count total
            count_statement = select(BookingModel).where(and_(*conditions))
            all_models = session.exec(count_statement).all()
            total = len(all_models)
            
            # Get paginated results
            statement = (
                select(BookingModel)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            
            items = [self._mapper.to_domain(model) for model in models]
            has_next = skip + limit < total
            
            return BookingSearchResult(items=items, total=total, has_next=has_next)
    
    async def get_all(self, tenant_id: str) -> List[Booking]:
        """Get all bookings for a tenant"""
        with self._session_factory() as session:
            statement = select(BookingModel).where(
                BookingModel.tenant_id == tenant_id
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def delete(self, tenant_id: str, booking_id: str, hard_delete: bool = False) -> bool:
        """Delete a booking (soft-delete by default, hard-delete if specified)"""
        with self._session_factory() as session:
            statement = select(BookingModel).where(
                BookingModel.id == booking_id,
                BookingModel.tenant_id == tenant_id
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
                raise BusinessRuleError(f"Failed to delete booking: {str(e)}")

