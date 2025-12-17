"""
User Domain Layer

Entities and repository interfaces for user management.
"""

from .entity import User
from .preferences import UserPreferences
from .repository import UserRepository
from .preference_repository import UserPreferenceRepository

__all__ = [
    "User",
    "UserPreferences",
    "UserRepository",
    "UserPreferenceRepository",
]

