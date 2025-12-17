"""
User commands for CQRS pattern
"""
from dataclasses import dataclass
from typing import Optional
from app.domain.shared.value_objects.email import Email
from app.domain.shared.value_objects.first_name import FirstName
from app.domain.shared.value_objects.last_name import LastName


@dataclass
class CreateUserCommand:
    """Command to create a new user"""
    username: str
    first_name: str
    last_name: str
    email: str


@dataclass
class UpdateUserCommand:
    """Command to update an existing user"""
    user_id: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None


@dataclass
class DeleteUserCommand:
    """Command to delete a user"""
    user_id: str


@dataclass
class ActivateUserCommand:
    """Command to activate a user"""
    user_id: str


@dataclass
class DeactivateUserCommand:
    """Command to deactivate a user"""
    user_id: str


@dataclass
class LockUserCommand:
    """Command to lock a user account"""
    user_id: str
    lockout_minutes: int = 60  # Default to 60 minutes


@dataclass
class UnlockUserCommand:
    """Command to unlock a user account"""
    user_id: str

