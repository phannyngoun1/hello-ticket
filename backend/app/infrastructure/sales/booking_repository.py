"""
Booking repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_, or_
from sqlalchemy.exc import IntegrityError
from app.domain.sales.booking import Booking
from app.domain.sales.booking_repositories import BookingRepository, BookingSearchResult
from app.infrastructure.shared.database.models import BookingModel, BookingItemModel
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
        """Save or update a booking with its items"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if booking exists (within tenant scope)
            statement = select(BookingModel).where(
                BookingModel.id == booking.id,
                BookingModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            # Convert domain to models
            booking_model, item_models = self._mapper.to_model(booking)
            
            if existing_model:
                # Update existing booking
                # Update booking fields
                for key, value in booking_model.dict(exclude={'id', 'tenant_id', 'created_at'}).items():
                    setattr(existing_model, key, value)
                
                # Delete existing items
                existing_items_stmt = select(BookingItemModel).where(
                    BookingItemModel.booking_id == booking.id,
                    BookingItemModel.tenant_id == tenant_id
                )
                existing_items = session.exec(existing_items_stmt).all()
                for item in existing_items:
                    session.delete(item)
                
                # Add new items
                for item_model in item_models:
                    session.add(item_model)
                
                try:
                    session.commit()
                    session.refresh(existing_model)
                    # Reload items
                    items_stmt = select(BookingItemModel).where(
                        BookingItemModel.booking_id == booking.id,
                        BookingItemModel.tenant_id == tenant_id
                    )
                    updated_items = session.exec(items_stmt).all()
                    return self._mapper.to_domain(existing_model, list(updated_items))
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update booking: {str(e)}")
            else:
                # Create new booking
                # First, add and flush the booking to ensure it exists in the database
                session.add(booking_model)
                session.flush()  # Flush to get the booking_id persisted (but not committed yet)
                
                # Now add items with the booking_id reference
                for item_model in item_models:
                    session.add(item_model)
                
                try:
                    session.commit()
                    session.refresh(booking_model)
                    # Reload items to ensure they're properly loaded
                    items_stmt = select(BookingItemModel).where(
                        BookingItemModel.booking_id == booking_model.id,
                        BookingItemModel.tenant_id == tenant_id
                    )
                    saved_items = session.exec(items_stmt).all()
                    return self._mapper.to_domain(booking_model, list(saved_items))
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create booking: {str(e)}")
    
    async def get_by_id(self, tenant_id: str, booking_id: str) -> Optional[Booking]:
        """Get booking by ID with items (within tenant scope)"""
        with self._session_factory() as session:
            # Get booking
            booking_stmt = select(BookingModel).where(
                BookingModel.id == booking_id,
                BookingModel.tenant_id == tenant_id
            )
            booking_model = session.exec(booking_stmt).first()
            if not booking_model:
                return None
            
            # Get items
            items_stmt = select(BookingItemModel).where(
                BookingItemModel.booking_id == booking_id,
                BookingItemModel.tenant_id == tenant_id
            )
            item_models = session.exec(items_stmt).all()
            
            return self._mapper.to_domain(booking_model, list(item_models))
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Booking]:
        """Get booking by booking number"""
        if not code or not code.strip():
            return None
        with self._session_factory() as session:
            booking_stmt = select(BookingModel).where(
                BookingModel.tenant_id == tenant_id,
                BookingModel.booking_number == code.strip()
            )
            booking_model = session.exec(booking_stmt).first()
            if not booking_model:
                return None
            
            # Get items
            items_stmt = select(BookingItemModel).where(
                BookingItemModel.booking_id == booking_model.id,
                BookingItemModel.tenant_id == tenant_id
            )
            item_models = session.exec(items_stmt).all()
            
            return self._mapper.to_domain(booking_model, list(item_models))
    
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
            
            if search:
                search_term = f"%{search}%"
                conditions.append(
                    BookingModel.booking_number.ilike(search_term)
                )
            
            # Note: is_active and include_deleted are not applicable to transaction bookings
            # They are kept for interface compatibility but ignored
            
            # Count total
            count_statement = select(BookingModel).where(and_(*conditions))
            all_models = session.exec(count_statement).all()
            total = len(all_models)
            
            # Get paginated results - ordered by created_at descending (newest first)
            statement = (
                select(BookingModel)
                .where(and_(*conditions))
                .order_by(BookingModel.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            booking_models = session.exec(statement).all()
            
            # Load items for each booking
            items = []
            for booking_model in booking_models:
                items_stmt = select(BookingItemModel).where(
                    BookingItemModel.booking_id == booking_model.id,
                    BookingItemModel.tenant_id == tenant_id
                )
                item_models = session.exec(items_stmt).all()
                booking = self._mapper.to_domain(booking_model, list(item_models))
                items.append(booking)
            
            has_next = skip + limit < total
            
            return BookingSearchResult(items=items, total=total, has_next=has_next)
    
    async def get_all(self, tenant_id: str) -> List[Booking]:
        """Get all bookings with items for a tenant - ordered by created_at descending (newest first)"""
        with self._session_factory() as session:
            booking_stmt = (
                select(BookingModel)
                .where(BookingModel.tenant_id == tenant_id)
                .order_by(BookingModel.created_at.desc())
            )
            booking_models = session.exec(booking_stmt).all()
            
            bookings = []
            for booking_model in booking_models:
                items_stmt = select(BookingItemModel).where(
                    BookingItemModel.booking_id == booking_model.id,
                    BookingItemModel.tenant_id == tenant_id
            )
                item_models = session.exec(items_stmt).all()
                booking = self._mapper.to_domain(booking_model, list(item_models))
                bookings.append(booking)
            
            return bookings
    
    async def delete(self, tenant_id: str, booking_id: str, hard_delete: bool = False) -> bool:
        """Delete a booking and its items (hard-delete only for transaction bookings)"""
        with self._session_factory() as session:
            booking_stmt = select(BookingModel).where(
                BookingModel.id == booking_id,
                BookingModel.tenant_id == tenant_id
            )
            booking_model = session.exec(booking_stmt).first()
            if not booking_model:
                return False
            
            # Get items to delete
            items_stmt = select(BookingItemModel).where(
                BookingItemModel.booking_id == booking_id,
                BookingItemModel.tenant_id == tenant_id
            )
            item_models = session.exec(items_stmt).all()
            
            if hard_delete:
                # Hard delete: permanently remove from database
                for item_model in item_models:
                    session.delete(item_model)
                session.delete(booking_model)
            else:
                # For transaction bookings, we cancel instead of soft-delete
                from datetime import datetime, timezone
                from app.shared.enums import BookingStatusEnum
                booking_model.status = BookingStatusEnum.CANCELLED.value
                booking_model.cancelled_at = datetime.now(timezone.utc)
                booking_model.updated_at = datetime.now(timezone.utc)
            
            try:
                session.commit()
                return True
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to delete booking: {str(e)}")

