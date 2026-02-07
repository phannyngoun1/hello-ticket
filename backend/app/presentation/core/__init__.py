"""
Core Presentation Layer

Routes and dependencies for core platform modules.
"""

from .routes import (
    auth_router,
    session_router,
    tenant_router,
    user_router,
    user_preferences_router,
    tenant_database_router,
    health_router,
    audit_router,
    cache_router,
    api_key_router,
    navigation_router,
    integration_router,
    workflow_router,
    external_api_router,
    upload_router,
    ai_router,
    role_router,
    group_router,
) 
from .dependencies import *

__all__ = [
    "auth_router",
    "session_router",
    "tenant_router",
    "user_router",
    "user_preferences_router",
    "tenant_database_router",
    "health_router",
    "audit_router",
    "cache_router",
    "api_key_router",
    "navigation_router",
    "integration_router",
    "workflow_router",
    "external_api_router",
    "upload_router",
    "ai_router",
    "role_router",
    "group_router",
    "sales_router",
]

