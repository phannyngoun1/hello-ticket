"""
User queries for CQRS pattern
"""
from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime


@dataclass
class GetUserByIdQuery:
    """Query to get user by ID"""
    user_id: str


@dataclass
class GetUserByEmailQuery:
    """Query to get user by email"""
    email: str


@dataclass
class GetAllUsersQuery:
    """Query to get all users with pagination and filtering"""
    skip: int = 0
    limit: int = 100
    search: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None


@dataclass
class SearchUsersQuery:
    """Query to search users by name, email, or username"""
    query: str
    skip: int = 0
    limit: int = 100


@dataclass
class UserExistsQuery:
    """Query to check if user exists"""
    user_id: Optional[str] = None
    email: Optional[str] = None


@dataclass
class ComplexUsersQuery:
    """Query for complex user filtering with arrays and nested filters"""
    skip: int = 0
    limit: int = 100
    search: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    user_ids: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    # Allow additional filter fields
    additional_filters: Optional[dict] = None

