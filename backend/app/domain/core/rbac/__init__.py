"""
RBAC Domain Layer

Entities and repository interfaces for Role-Based Access Control.
"""

from .entity import Role
from .group import Group
from .role_repository import IRoleRepository
from .group_repository import IGroupRepository

__all__ = [
    "Role",
    "Group",
    "IRoleRepository",
    "IGroupRepository",
]

