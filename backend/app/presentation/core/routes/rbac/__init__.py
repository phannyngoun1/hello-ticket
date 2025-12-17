"""
RBAC Presentation Layer

Routes for Role-Based Access Control (roles, groups).
"""

from .role_routes import router as role_router
from .group_routes import router as group_router

__all__ = ["role_router", "group_router"]

