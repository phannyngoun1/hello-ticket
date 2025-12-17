"""
User repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlmodel import Session, select, or_, and_
from app.domain.core.user.entity import User
from app.domain.core.user.repository import UserRepository
from app.infrastructure.shared.database.platform_models import UserModel
from app.infrastructure.shared.database.platform_connection import get_platform_session_sync
from app.infrastructure.core.user.mapper import UserMapper
from app.shared.tenant_context import get_tenant_context


class SQLUserRepository(UserRepository):
    """SQLModel implementation of UserRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_platform_session_sync
        self._mapper = UserMapper()
        self._tenant_id = tenant_id  # Override tenant context if provided
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, user: User) -> User:
        """Save or update a user"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if user exists (within tenant scope)
            statement = select(UserModel).where(
                UserModel.id == user.id,
                UserModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                # Update existing user
                existing_model.username = user.username
                existing_model.first_name = user.first_name.value
                existing_model.last_name = user.last_name.value
                existing_model.email = user.email.value
                existing_model.updated_at = user.updated_at
                existing_model.is_active = user.is_active
                existing_model.base_role = user.base_role
                existing_model.last_login = user.last_login
                session.add(existing_model)
                session.commit()
                session.refresh(existing_model)
                return self._mapper.to_domain(existing_model)
            else:
                # Create new user
                new_model = self._mapper.to_model(user)
                session.add(new_model)
                session.commit()
                session.refresh(new_model)
                return self._mapper.to_domain(new_model)
    
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(UserModel).where(
                UserModel.id == user_id,
                UserModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(UserModel).where(
                UserModel.email == email,
                UserModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(UserModel).where(
                UserModel.username == username,
                UserModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
    ) -> List[User]:
        """Get all users with pagination and filtering (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Start with base query filtering by tenant
            conditions = [UserModel.tenant_id == tenant_id]
            
            # Apply search filter (across name, email, username)
            if search:
                search_pattern = f"%{search}%"
                conditions.append(
                    or_(
                        UserModel.first_name.ilike(search_pattern),
                        UserModel.last_name.ilike(search_pattern),
                        UserModel.email.ilike(search_pattern),
                        UserModel.username.ilike(search_pattern)
                    )
                )
            
            # Apply role filter
            if role:
                conditions.append(UserModel.base_role == role)
            
            # Apply active status filter
            if is_active is not None:
                conditions.append(UserModel.is_active == is_active)
            
            # Apply created date range filters
            if created_after:
                conditions.append(UserModel.created_at >= created_after)
            if created_before:
                conditions.append(UserModel.created_at <= created_before)
            
            # Build final query
            statement = (
                select(UserModel)
                .where(*conditions)
                .offset(skip)
                .limit(limit)
                .order_by(UserModel.created_at.desc())
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def get_all_complex(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        user_ids: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        additional_filters: Optional[Dict[str, Any]] = None,
    ) -> List[User]:
        """
        Get all users with complex filtering including arrays (within tenant scope)
        
        This method supports:
        - Arrays of user IDs
        - Arrays of tags (for future tag system)
        - Additional custom filters
        """
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Start with base query filtering by tenant
            conditions = [UserModel.tenant_id == tenant_id]
            
            # Apply search filter (across name, email, username)
            if search:
                search_pattern = f"%{search}%"
                conditions.append(
                    or_(
                        UserModel.first_name.ilike(search_pattern),
                        UserModel.last_name.ilike(search_pattern),
                        UserModel.email.ilike(search_pattern),
                        UserModel.username.ilike(search_pattern)
                    )
                )
            
            # Apply role filter
            if role:
                conditions.append(UserModel.base_role == role)
            
            # Apply active status filter
            if is_active is not None:
                conditions.append(UserModel.is_active == is_active)
            
            # Apply created date range filters
            if created_after:
                conditions.append(UserModel.created_at >= created_after)
            if created_before:
                conditions.append(UserModel.created_at <= created_before)
            
            # Apply user IDs filter (array)
            if user_ids:
                conditions.append(UserModel.id.in_(user_ids))
            
            # Tags filter - placeholder for future tag system
            # If tags table exists, would join and filter here
            # For now, this is a placeholder that can be extended
            if tags:
                # TODO: Implement tag filtering when tag system is added
                # This would require a join with a tags table
                pass
            
            # Apply additional filters if provided
            # This allows for extensible filtering
            if additional_filters:
                for key, value in additional_filters.items():
                    # Handle simple equality filters
                    if hasattr(UserModel, key) and value is not None:
                        conditions.append(getattr(UserModel, key) == value)
                    # Could extend to support operators like gt, lt, etc.
            
            # Build final query
            statement = (
                select(UserModel)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
                .order_by(UserModel.created_at.desc())
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def delete(self, user_id: str) -> bool:
        """Delete user by ID (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(UserModel).where(
                UserModel.id == user_id,
                UserModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            if model:
                session.delete(model)
                session.commit()
                return True
            return False
    
    async def exists_by_email(self, email: str) -> bool:
        """Check if user exists by email (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(UserModel).where(
                UserModel.email == email,
                UserModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return model is not None
    
    async def exists_by_username(self, username: str) -> bool:
        """Check if user exists by username (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(UserModel).where(
                UserModel.username == username,
                UserModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return model is not None
    
    async def get_by_ids(self, user_ids: List[str]) -> List[User]:
        """
        Get multiple users by IDs in batch (within tenant scope)
        
        This is more efficient than calling get_by_id() multiple times.
        Useful for syncing or enriching data with user information.
        """
        if not user_ids:
            return []
        
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(UserModel).where(
                UserModel.id.in_(user_ids),
                UserModel.tenant_id == tenant_id
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def search(self, query: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Search users by name, email, or username (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Search across first_name, last_name, email, and username fields
            search_pattern = f"%{query}%"
            statement = (
                select(UserModel)
                .where(
                    UserModel.tenant_id == tenant_id,
                    (
                        UserModel.first_name.ilike(search_pattern) |
                        UserModel.last_name.ilike(search_pattern) |
                        UserModel.email.ilike(search_pattern) |
                        UserModel.username.ilike(search_pattern)
                    )
                )
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def count_all(
        self,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
    ) -> int:
        """Count all users matching filters (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            from sqlmodel import func
            
            # Start with base query filtering by tenant
            conditions = [UserModel.tenant_id == tenant_id]
            
            # Apply search filter (across name, email, username)
            if search:
                search_pattern = f"%{search}%"
                conditions.append(
                    or_(
                        UserModel.first_name.ilike(search_pattern),
                        UserModel.last_name.ilike(search_pattern),
                        UserModel.email.ilike(search_pattern),
                        UserModel.username.ilike(search_pattern)
                    )
                )
            
            # Apply role filter
            if role:
                conditions.append(UserModel.base_role == role)
            
            # Apply active status filter
            if is_active is not None:
                conditions.append(UserModel.is_active == is_active)
            
            # Apply created date range filters
            if created_after:
                conditions.append(UserModel.created_at >= created_after)
            if created_before:
                conditions.append(UserModel.created_at <= created_before)
            
            # Build count query
            statement = (
                select(func.count())
                .select_from(UserModel)
                .where(and_(*conditions))
            )
            count = session.exec(statement).one()
            return count
    
    async def count_all_complex(
        self,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        user_ids: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        additional_filters: Optional[Dict[str, Any]] = None,
    ) -> int:
        """Count all users matching complex filters (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            from sqlmodel import func
            
            # Start with base query filtering by tenant
            conditions = [UserModel.tenant_id == tenant_id]
            
            # Apply search filter (across name, email, username)
            if search:
                search_pattern = f"%{search}%"
                conditions.append(
                    or_(
                        UserModel.first_name.ilike(search_pattern),
                        UserModel.last_name.ilike(search_pattern),
                        UserModel.email.ilike(search_pattern),
                        UserModel.username.ilike(search_pattern)
                    )
                )
            
            # Apply role filter
            if role:
                conditions.append(UserModel.base_role == role)
            
            # Apply active status filter
            if is_active is not None:
                conditions.append(UserModel.is_active == is_active)
            
            # Apply created date range filters
            if created_after:
                conditions.append(UserModel.created_at >= created_after)
            if created_before:
                conditions.append(UserModel.created_at <= created_before)
            
            # Apply user IDs filter (array)
            if user_ids:
                conditions.append(UserModel.id.in_(user_ids))
            
            # Tags filter - placeholder for future tag system
            if tags:
                # TODO: Implement tag filtering when tag system is added
                pass
            
            # Apply additional filters if provided
            if additional_filters:
                for key, value in additional_filters.items():
                    if hasattr(UserModel, key) and value is not None:
                        conditions.append(getattr(UserModel, key) == value)
            
            # Build count query
            statement = (
                select(func.count())
                .select_from(UserModel)
                .where(and_(*conditions))
            )
            count = session.exec(statement).one()
            return count