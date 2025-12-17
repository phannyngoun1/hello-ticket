"""
Authentication repository interface - Port in Hexagonal Architecture
"""
from abc import ABC, abstractmethod
from typing import Optional
from app.domain.shared.authenticated_user import AuthenticatedUser


class AuthRepository(ABC):
    """Authentication repository interface"""
    
    @abstractmethod
    async def save(self, user: AuthenticatedUser) -> AuthenticatedUser:
        """Save or update authenticated user"""
        pass
    
    @abstractmethod
    async def get_by_id(self, user_id: str) -> Optional[AuthenticatedUser]:
        """Get user by ID"""
        pass
    
    @abstractmethod
    async def get_by_username(self, username: str) -> Optional[AuthenticatedUser]:
        """Get user by username"""
        pass
    
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[AuthenticatedUser]:
        """Get user by email"""
        pass
    
    @abstractmethod
    async def exists_by_username(self, username: str) -> bool:
        """Check if username exists"""
        pass
    
    @abstractmethod
    async def exists_by_email(self, email: str) -> bool:
        """Check if email exists"""
        pass
    
    @abstractmethod
    async def delete(self, user_id: str) -> bool:
        """Delete user by ID"""
        pass

