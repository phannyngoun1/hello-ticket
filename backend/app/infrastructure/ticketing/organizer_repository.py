"""
Organizer repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_, or_
from sqlalchemy.exc import IntegrityError
from app.domain.ticketing.organizer import Organizer
from app.domain.ticketing.organizer_repositories import OrganizerRepository, OrganizerSearchResult
from app.infrastructure.shared.database.models import OrganizerModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.ticketing.mapper_organizer import OrganizerMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError


class SQLOrganizerRepository(OrganizerRepository):
    """SQLModel implementation of OrganizerRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._mapper = OrganizerMapper()
        self._tenant_id = tenant_id  # Override tenant context if provided
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, organizer: Organizer) -> Organizer:
        """Save or update a organizer"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if organizer exists (within tenant scope)
            statement = select(OrganizerModel).where(
                OrganizerModel.id == organizer.id,
                OrganizerModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                # Update existing organizer
                # Use merge with a new model instance to ensure proper change tracking
                updated_model = self._mapper.to_model(organizer)
                # Merge will update the existing model in the session
                merged_model = session.merge(updated_model)
                try:
                    session.commit()
                    session.refresh(merged_model)
                    return self._mapper.to_domain(merged_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update organizer: {str(e)}")
            else:
                # Create new organizer
                new_model = self._mapper.to_model(organizer)
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    return self._mapper.to_domain(new_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create organizer: {str(e)}")
    
    async def get_by_id(self, tenant_id: str, organizer_id: str) -> Optional[Organizer]:
        """Get organizer by ID (within tenant scope)"""
        with self._session_factory() as session:
            statement = select(OrganizerModel).where(
                OrganizerModel.id == organizer_id,
                OrganizerModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Organizer]:
        """Get organizer by business code"""
        if not code or not code.strip():
            return None
        with self._session_factory() as session:
            statement = select(OrganizerModel).where(
                OrganizerModel.tenant_id == tenant_id,
                OrganizerModel.code == code.strip().upper()
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
    ) -> OrganizerSearchResult:
        """Search organizers by term and status"""
        with self._session_factory() as session:
            conditions = [OrganizerModel.tenant_id == tenant_id]
            
            # Exclude deleted records by default
            if not include_deleted:
                conditions.append(OrganizerModel.is_deleted == False)
            
            if search:
                search_term = f"%{search}%"
                conditions.append(
                    or_(
                        OrganizerModel.code.ilike(search_term),
                        OrganizerModel.name.ilike(search_term)
                    )
                )
            
            if is_active is not None:
                conditions.append(OrganizerModel.is_active == is_active)
            
            # Count total
            count_statement = select(OrganizerModel).where(and_(*conditions))
            all_models = session.exec(count_statement).all()
            total = len(all_models)
            
            # Get paginated results
            statement = (
                select(OrganizerModel)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            
            items = [self._mapper.to_domain(model) for model in models]
            has_next = skip + limit < total
            
            return OrganizerSearchResult(items=items, total=total, has_next=has_next)
    
    async def get_all(self, tenant_id: str) -> List[Organizer]:
        """Get all organizers for a tenant"""
        with self._session_factory() as session:
            statement = select(OrganizerModel).where(
                OrganizerModel.tenant_id == tenant_id
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def delete(self, tenant_id: str, organizer_id: str, hard_delete: bool = False) -> bool:
        """Delete a organizer (soft-delete by default, hard-delete if specified)"""
        with self._session_factory() as session:
            statement = select(OrganizerModel).where(
                OrganizerModel.id == organizer_id,
                OrganizerModel.tenant_id == tenant_id
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
                raise BusinessRuleError(f"Failed to delete organizer: {str(e)}")

