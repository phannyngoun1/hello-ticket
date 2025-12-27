"""
Show repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_, or_
from sqlalchemy.exc import IntegrityError, ProgrammingError
from sqlalchemy import text
from app.domain.ticketing.show import Show
from app.domain.ticketing.show_repositories import ShowRepository, ShowSearchResult
from app.infrastructure.shared.database.models import ShowModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.ticketing.mapper_show import ShowMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError


class SQLShowRepository(ShowRepository):
    """SQLModel implementation of ShowRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._mapper = ShowMapper()
        self._tenant_id = tenant_id  # Override tenant context if provided
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, show: Show) -> Show:
        """Save or update a show"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if show exists (within tenant scope)
            statement = select(ShowModel).where(
                ShowModel.id == show.id,
                ShowModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                # Update existing show
                # Use merge with a new model instance to ensure proper change tracking
                updated_model = self._mapper.to_model(show)
                # Merge will update the existing model in the session
                merged_model = session.merge(updated_model)
                try:
                    session.commit()
                    session.refresh(merged_model)
                    return self._mapper.to_domain(merged_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update show: {str(e)}")
            else:
                # Create new show
                new_model = self._mapper.to_model(show)
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    return self._mapper.to_domain(new_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create show: {str(e)}")
    
    async def get_by_id(self, tenant_id: str, show_id: str) -> Optional[Show]:
        """Get show by ID (within tenant scope)"""
        with self._session_factory() as session:
            try:
                statement = select(ShowModel).where(
                    ShowModel.id == show_id,
                    ShowModel.tenant_id == tenant_id
                )
                model = session.exec(statement).first()
                return self._mapper.to_domain(model) if model else None
            except (ProgrammingError, AttributeError) as e:
                # Handle case where database schema doesn't match model (e.g., missing columns)
                # This can happen if migrations haven't been run
                error_msg = str(e).lower()
                if "does not exist" in error_msg or "column" in error_msg or "attribute" in error_msg:
                    # Fallback: select only columns that definitely exist (core columns)
                    try:
                        result = session.exec(
                            text(
                                "SELECT id, tenant_id, code, name, organizer_id, is_active, "
                                "is_deleted, version, created_at, updated_at, deleted_at "
                                "FROM shows WHERE id = :show_id AND tenant_id = :tenant_id"
                            ).bindparams(show_id=show_id, tenant_id=tenant_id)
                        ).first()
                        if result:
                            # Create a minimal model with available columns
                            # Map row result to model dict
                            model_dict = {
                                'id': result[0],
                                'tenant_id': result[1],
                                'code': result[2],
                                'name': result[3],
                                'organizer_id': result[4],
                                'is_active': result[5],
                                'is_deleted': result[6],
                                'version': result[7],
                                'created_at': result[8],
                                'updated_at': result[9],
                                'deleted_at': result[10] if len(result) > 10 else None,
                                # Optional columns that might not exist
                                'started_date': None,
                                'ended_date': None,
                                'note': None,
                            }
                            # Create model instance manually
                            model = ShowModel(**model_dict)
                            return self._mapper.to_domain(model)
                    except Exception:
                        # If fallback also fails, return None
                        return None
                raise
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Show]:
        """Get show by business code"""
        if not code or not code.strip():
            return None
        with self._session_factory() as session:
            try:
                statement = select(ShowModel).where(
                    ShowModel.tenant_id == tenant_id,
                    ShowModel.code == code.strip().upper()
                )
                model = session.exec(statement).first()
                return self._mapper.to_domain(model) if model else None
            except (ProgrammingError, AttributeError) as e:
                # Handle case where database schema doesn't match model
                error_msg = str(e).lower()
                if "does not exist" in error_msg or "column" in error_msg or "attribute" in error_msg:
                    # Fallback: use raw SQL
                    try:
                        result = session.exec(
                            text(
                                "SELECT id, tenant_id, code, name, organizer_id, is_active, "
                                "is_deleted, version, created_at, updated_at, deleted_at "
                                "FROM shows WHERE tenant_id = :tenant_id AND code = :code"
                            ).bindparams(tenant_id=tenant_id, code=code.strip().upper())
                        ).first()
                        if result:
                            model_dict = {
                                'id': result[0], 'tenant_id': result[1], 'code': result[2],
                                'name': result[3], 'organizer_id': result[4], 'is_active': result[5],
                                'is_deleted': result[6], 'version': result[7],
                                'created_at': result[8], 'updated_at': result[9],
                                'deleted_at': result[10] if len(result) > 10 else None,
                                'started_date': None, 'ended_date': None, 'note': None,
                            }
                            model = ShowModel(**model_dict)
                            return self._mapper.to_domain(model)
                    except Exception:
                        return None
                raise
    
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        include_deleted: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> ShowSearchResult:
        """Search shows by term and status"""
        with self._session_factory() as session:
            try:
                conditions = [ShowModel.tenant_id == tenant_id]
                
                # Exclude deleted records by default
                if not include_deleted:
                    conditions.append(ShowModel.is_deleted == False)
                
                if search:
                    search_term = f"%{search}%"
                    conditions.append(
                        or_(
                            ShowModel.code.ilike(search_term),
                            ShowModel.name.ilike(search_term)
                        )
                    )
                
                if is_active is not None:
                    conditions.append(ShowModel.is_active == is_active)
                
                # Count total
                count_statement = select(ShowModel).where(and_(*conditions))
                all_models = session.exec(count_statement).all()
                total = len(all_models)
                
                # Get paginated results
                statement = (
                    select(ShowModel)
                    .where(and_(*conditions))
                    .offset(skip)
                    .limit(limit)
                )
                models = session.exec(statement).all()
                
                items = [self._mapper.to_domain(model) for model in models]
                has_next = skip + limit < total
                
                return ShowSearchResult(items=items, total=total, has_next=has_next)
            except (ProgrammingError, AttributeError) as e:
                # Handle case where database schema doesn't match model (e.g., missing columns)
                error_msg = str(e).lower()
                if "does not exist" in error_msg or "column" in error_msg or "attribute" in error_msg:
                    # Fallback: use raw SQL to select only core columns
                    where_clauses = ["tenant_id = :tenant_id"]
                    params = {"tenant_id": tenant_id}
                    
                    if not include_deleted:
                        where_clauses.append("is_deleted = false")
                    
                    if search:
                        search_term = f"%{search}%"
                        where_clauses.append("(code ILIKE :search OR name ILIKE :search)")
                        params["search"] = search_term
                    
                    if is_active is not None:
                        where_clauses.append("is_active = :is_active")
                        params["is_active"] = is_active
                    
                    where_sql = " AND ".join(where_clauses)
                    
                    # Count query
                    count_query = text(f"SELECT COUNT(*) as count FROM shows WHERE {where_sql}")
                    total_result = session.exec(count_query.bindparams(**params)).first()
                    # Handle both tuple and Row object access
                    if total_result:
                        total = total_result[0] if isinstance(total_result, (tuple, list)) else getattr(total_result, 'count', total_result[0])
                    else:
                        total = 0
                    
                    # Data query
                    data_query = text(
                        f"SELECT id, tenant_id, code, name, organizer_id, is_active, "
                        f"is_deleted, version, created_at, updated_at, deleted_at "
                        f"FROM shows WHERE {where_sql} "
                        f"ORDER BY created_at DESC OFFSET :skip LIMIT :limit"
                    )
                    params["skip"] = skip
                    params["limit"] = limit
                    results = session.exec(data_query.bindparams(**params)).all()
                    
                    # Convert results to Show models
                    items = []
                    for row in results:
                        model_dict = {
                            'id': row[0],
                            'tenant_id': row[1],
                            'code': row[2],
                            'name': row[3],
                            'organizer_id': row[4],
                            'is_active': row[5],
                            'is_deleted': row[6],
                            'version': row[7],
                            'created_at': row[8],
                            'updated_at': row[9],
                            'deleted_at': row[10] if len(row) > 10 else None,
                            'started_date': None,
                            'ended_date': None,
                            'note': None,
                        }
                        model = ShowModel(**model_dict)
                        items.append(self._mapper.to_domain(model))
                    
                    has_next = skip + limit < total
                    return ShowSearchResult(items=items, total=total, has_next=has_next)
                raise
    
    async def get_all(self, tenant_id: str) -> List[Show]:
        """Get all shows for a tenant"""
        with self._session_factory() as session:
            statement = select(ShowModel).where(
                ShowModel.tenant_id == tenant_id
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def delete(self, tenant_id: str, show_id: str, hard_delete: bool = False) -> bool:
        """Delete a show (soft-delete by default, hard-delete if specified)"""
        with self._session_factory() as session:
            statement = select(ShowModel).where(
                ShowModel.id == show_id,
                ShowModel.tenant_id == tenant_id
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
                raise BusinessRuleError(f"Failed to delete show: {str(e)}")

