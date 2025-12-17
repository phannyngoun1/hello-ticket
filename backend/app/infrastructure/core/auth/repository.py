"""
Authentication repository implementation - Adapter in Hexagonal Architecture
"""
from typing import Optional
from sqlmodel import Session, select
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.core.auth.repository import AuthRepository
from app.infrastructure.shared.database.platform_models import UserModel
from app.infrastructure.shared.database.platform_connection import get_platform_session_sync
from app.infrastructure.core.auth.mapper import AuthMapper


class SQLAuthRepository(AuthRepository):
    """SQLModel implementation of AuthRepository"""
    
    def __init__(self, session: Optional[Session] = None):
        self._session_factory = session if session else get_platform_session_sync
        self._mapper = AuthMapper()
    
    async def save(self, user: AuthenticatedUser) -> AuthenticatedUser:
        """Save or update authenticated user"""
        with self._session_factory() as session:
            # Use query with tenant filter for safety (even though ID should be unique)
            existing_model = session.exec(
                select(UserModel).where(
                    UserModel.id == user.id,
                    UserModel.tenant_id == user.tenant_id
                )
            ).first()
            
            if existing_model:
                # Update existing user
                existing_model.username = user.username
                existing_model.first_name = user.first_name.value
                existing_model.last_name = user.last_name.value
                existing_model.email = user.email.value
                existing_model.hashed_password = user.hashed_password
                existing_model.base_role = user.role.value  # Changed from role to base_role
                existing_model.is_active = user.is_active
                existing_model.is_verified = user.is_verified
                existing_model.must_change_password = user.must_change_password
                existing_model.last_login = user.last_login
                existing_model.last_password_change = user.last_password_change
                existing_model.failed_login_attempts = user.failed_login_attempts
                existing_model.locked_until = user.locked_until
                existing_model.updated_at = user.updated_at
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
    
    async def get_by_id(self, user_id: str) -> Optional[AuthenticatedUser]:
        """Get user by ID"""
        with self._session_factory() as session:
            # Note: get_by_id doesn't filter by tenant since it's used for authentication
            # The user_id should be globally unique, but we use query for consistency
            model = session.exec(select(UserModel).where(UserModel.id == user_id)).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_username(self, username: str) -> Optional[AuthenticatedUser]:
        """Get user by username"""
        with self._session_factory() as session:
            statement = select(UserModel).where(UserModel.username == username)
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_email(self, email: str) -> Optional[AuthenticatedUser]:
        """Get user by email"""
        with self._session_factory() as session:
            statement = select(UserModel).where(UserModel.email == email)
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def exists_by_username(self, username: str) -> bool:
        """Check if username exists"""
        with self._session_factory() as session:
            statement = select(UserModel).where(UserModel.username == username)
            model = session.exec(statement).first()
            return model is not None
    
    async def exists_by_email(self, email: str) -> bool:
        """Check if email exists"""
        with self._session_factory() as session:
            statement = select(UserModel).where(UserModel.email == email)
            model = session.exec(statement).first()
            return model is not None
    
    async def delete(self, user_id: str) -> bool:
        """Delete user by ID"""
        with self._session_factory() as session:
            model = session.get(UserModel, user_id)
            if model:
                session.delete(model)
                session.commit()
                return True
            return False

