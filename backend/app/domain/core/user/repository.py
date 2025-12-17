"""
User repository interface - Port in Hexagonal Architecture
"""
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional
from app.domain.core.user.entity import User


class UserRepository(ABC):
    """User repository interface"""
    
    @abstractmethod
    async def save(self, user: User) -> User:
        """Save or update a user"""
        pass
    
    @abstractmethod
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        pass
    
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        pass
    
    @abstractmethod
    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        pass
    
    @abstractmethod
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
        """Get all users with pagination and filtering"""
        pass
    
    @abstractmethod
    async def delete(self, user_id: str) -> bool:
        """Delete user by ID"""
        pass
    
    @abstractmethod
    async def exists_by_email(self, email: str) -> bool:
        """Check if user exists by email"""
        pass
    
    @abstractmethod
    async def exists_by_username(self, username: str) -> bool:
        """Check if user exists by username"""
        pass
    
    @abstractmethod
    async def search(self, query: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Search users by name, email, or username"""
        pass
    
    @abstractmethod
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
        additional_filters: Optional[dict] = None,
    ) -> List[User]:
        """Get all users with complex filtering including arrays"""
        pass
    
    @abstractmethod
    async def count_all(
        self,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
    ) -> int:
        """Count all users matching filters"""
        pass
    
    @abstractmethod
    async def count_all_complex(
        self,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        user_ids: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        additional_filters: Optional[dict] = None,
    ) -> int:
        """Count all users matching complex filters"""
        pass

