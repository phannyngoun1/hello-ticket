"""
Shared Routes

Truly shared utilities used across multiple modules (base CRUD router, presets).
"""

from .base_crud_router import BaseCRUDRouter, CRUDRouterConfig
from .crud_presets import quick_crud_router, CRUDPresets
from .enum_routes import router as enum_router
from .attachment_routes import router as attachment_router

__all__ = [
    "BaseCRUDRouter",
    "CRUDRouterConfig",
    "quick_crud_router",
    "CRUDPresets",
    "enum_router",
    "attachment_router",
]
