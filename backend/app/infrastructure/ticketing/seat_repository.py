"""
Seat repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_
from sqlalchemy.exc import IntegrityError, ProgrammingError
from app.domain.ticketing.seat import Seat
from app.domain.ticketing.seat_repositories import SeatRepository, SeatSearchResult
from app.infrastructure.shared.database.models import SeatModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.ticketing.mapper_seat import SeatMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError


class SQLSeatRepository(SeatRepository):
    """SQLModel implementation of SeatRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._mapper = SeatMapper()
        self._tenant_id = tenant_id  # Override tenant context if provided
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, seat: Seat) -> Seat:
        """Save or update a seat"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if seat exists (within tenant scope)
            # Handle case where layout_id column doesn't exist yet
            existing_model = None
            try:
                statement = select(SeatModel).where(
                    SeatModel.id == seat.id,
                    SeatModel.tenant_id == tenant_id
                )
                existing_model = session.exec(statement).first()
            except ProgrammingError as e:
                # If layout_id column doesn't exist, assume seat doesn't exist either
                # (since we can't query it properly)
                if "layout_id" in str(e) and "does not exist" in str(e):
                    existing_model = None  # Treat as new seat
                else:
                    raise
            
            if existing_model:
                # Update existing seat
                updated_model = self._mapper.to_model(seat)
                merged_model = session.merge(updated_model)
                try:
                    session.commit()
                    try:
                        session.refresh(merged_model)
                    except ProgrammingError as refresh_error:
                        # Handle case where layout_id column doesn't exist yet during refresh
                        if "layout_id" in str(refresh_error) and "does not exist" in str(refresh_error):
                            pass  # Skip refresh, use the model as-is
                        else:
                            raise
                    return self._mapper.to_domain(merged_model)
                except ProgrammingError as e:
                    session.rollback()
                    # If layout_id column doesn't exist, provide a helpful error
                    if "layout_id" in str(e) and "does not exist" in str(e):
                        raise BusinessRuleError(
                            "Cannot update seat: layout_id column does not exist in database. "
                            "Please run database migration to add the layout_id column to the seats table."
                        )
                    raise BusinessRuleError(f"Failed to update seat: {str(e)}")
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update seat: {str(e)}")
            else:
                # Create new seat
                new_model = self._mapper.to_model(seat)
                session.add(new_model)
                try:
                    session.commit()
                except ProgrammingError as commit_error:
                    session.rollback()
                    # If layout_id column doesn't exist during commit, provide helpful error
                    if "layout_id" in str(commit_error) and "does not exist" in str(commit_error):
                        raise BusinessRuleError(
                            "Cannot create seat: layout_id column does not exist in database. "
                            "Please run database migration to add the layout_id column to the seats table."
                        )
                    raise BusinessRuleError(f"Failed to create seat: {str(commit_error)}")
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create seat: {str(e)}")
                
                # Try to refresh, but handle missing column gracefully
                try:
                    session.refresh(new_model)
                except ProgrammingError as refresh_error:
                    # Handle case where layout_id column doesn't exist yet during refresh
                    # This can happen if INSERT succeeded but SELECT fails
                    if "layout_id" in str(refresh_error) and "does not exist" in str(refresh_error):
                        # Skip refresh, return domain entity from the model we created
                        # The seat was inserted successfully, we just can't refresh it
                        pass
                    else:
                        raise
                
                return self._mapper.to_domain(new_model)
    
    async def get_by_id(self, tenant_id: str, seat_id: str) -> Optional[Seat]:
        """Get seat by ID (within tenant scope)"""
        with self._session_factory() as session:
            try:
                statement = select(SeatModel).where(
                    SeatModel.id == seat_id,
                    SeatModel.tenant_id == tenant_id,
                    SeatModel.is_deleted == False
                )
                model = session.exec(statement).first()
                return self._mapper.to_domain(model) if model else None
            except ProgrammingError as e:
                # Handle case where layout_id column doesn't exist yet
                if "layout_id" in str(e) and "does not exist" in str(e):
                    return None  # Column doesn't exist, seat can't be found
                raise
    
    async def get_by_venue(
        self,
        tenant_id: str,
        venue_id: str,
        skip: int = 0,
        limit: int = 1000,
    ) -> SeatSearchResult:
        """Get all seats for a venue"""
        with self._session_factory() as session:
            conditions = [
                SeatModel.tenant_id == tenant_id,
                SeatModel.venue_id == venue_id,
                SeatModel.is_deleted == False
            ]
            
            # Count total
            count_statement = select(SeatModel).where(and_(*conditions))
            all_models = session.exec(count_statement).all()
            total = len(all_models)
            
            # Get paginated results
            statement = (
                select(SeatModel)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            
            items = [self._mapper.to_domain(model) for model in models]
            has_next = skip + limit < total
            
            return SeatSearchResult(items=items, total=total, has_next=has_next)
    
    async def get_by_layout(
        self,
        tenant_id: str,
        layout_id: str,
        skip: int = 0,
        limit: int = 1000,
    ) -> SeatSearchResult:
        """Get all seats for a layout"""
        from sqlalchemy.exc import ProgrammingError
        
        with self._session_factory() as session:
            try:
                conditions = [
                    SeatModel.tenant_id == tenant_id,
                    SeatModel.layout_id == layout_id,
                    SeatModel.is_deleted == False
                ]
                
                # Count total
                count_statement = select(SeatModel).where(and_(*conditions))
                all_models = session.exec(count_statement).all()
                total = len(all_models)
                
                # Get paginated results
                statement = (
                    select(SeatModel)
                    .where(and_(*conditions))
                    .offset(skip)
                    .limit(limit)
                )
                models = session.exec(statement).all()
                
                items = [self._mapper.to_domain(model) for model in models]
                has_next = skip + limit < total
                
                return SeatSearchResult(items=items, total=total, has_next=has_next)
            except ProgrammingError as e:
                # Handle case where layout_id column doesn't exist yet (before migration)
                # Return empty results for new layouts
                if "layout_id" in str(e) and "does not exist" in str(e):
                    return SeatSearchResult(items=[], total=0, has_next=False)
                raise

    async def get_all_by_layout(
        self,
        tenant_id: str,
        layout_id: str,
    ) -> List[Seat]:
        """Get all seats for a layout"""
        with self._session_factory() as session:
            statement = select(SeatModel).where(
                SeatModel.tenant_id == tenant_id,
                SeatModel.layout_id == layout_id,
                SeatModel.is_deleted == False
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def get_by_venue_and_location(
        self,
        tenant_id: str,
        venue_id: str,
        section: str,
        row: str,
        seat_number: str,
    ) -> Optional[Seat]:
        """Get seat by venue and location"""
        with self._session_factory() as session:
            statement = select(SeatModel).where(
                SeatModel.tenant_id == tenant_id,
                SeatModel.venue_id == venue_id,
                SeatModel.section == section,
                SeatModel.row == row,
                SeatModel.seat_number == seat_number,
                SeatModel.is_deleted == False
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_layout_and_location(
        self,
        tenant_id: str,
        layout_id: str,
        section: str,
        row: str,
        seat_number: str,
        include_deleted: bool = False,
    ) -> Optional[Seat]:
        """Get seat by layout and location"""
        with self._session_factory() as session:
            conditions = [
                SeatModel.tenant_id == tenant_id,
                SeatModel.layout_id == layout_id,
                SeatModel.section == section,
                SeatModel.row == row,
                SeatModel.seat_number == seat_number,
            ]
            if not include_deleted:
                conditions.append(SeatModel.is_deleted == False)
            
            statement = select(SeatModel).where(and_(*conditions))
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def delete(self, tenant_id: str, seat_id: str, hard_delete: bool = False) -> bool:
        """Delete a seat (soft-delete by default, hard-delete if specified)"""
        with self._session_factory() as session:
            statement = select(SeatModel).where(
                SeatModel.id == seat_id,
                SeatModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            if not model:
                return False
            
            if hard_delete:
                session.delete(model)
            else:
                from datetime import datetime, timezone
                model.is_deleted = True
                model.deleted_at = datetime.now(timezone.utc)
                model.updated_at = datetime.now(timezone.utc)
            
            try:
                session.commit()
                return True
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to delete seat: {str(e)}")
    
    async def delete_by_venue(self, tenant_id: str, venue_id: str) -> int:
        """Delete all seats for a venue"""
        with self._session_factory() as session:
            statement = select(SeatModel).where(
                SeatModel.tenant_id == tenant_id,
                SeatModel.venue_id == venue_id,
                SeatModel.is_deleted == False
            )
            models = session.exec(statement).all()
            count = len(models)
            
            if count > 0:
                from datetime import datetime, timezone
                for model in models:
                    model.is_deleted = True
                    model.deleted_at = datetime.now(timezone.utc)
                    model.updated_at = datetime.now(timezone.utc)
                
                try:
                    session.commit()
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to delete seats: {str(e)}")
            
            return count
