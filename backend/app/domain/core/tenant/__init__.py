"""
Tenant Domain Layer

Entities and repository interfaces for tenant management.
"""

from .entity import Tenant
from .repository import TenantRepository

__all__ = ["Tenant", "TenantRepository"]

