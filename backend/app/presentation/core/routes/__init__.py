"""
Core Routes

Core platform routes (auth, session, tenant, user, health, audit, etc.).
"""

from .auth_routes import router as auth_router
from .session_routes import router as session_router
from .tenant_routes import router as tenant_router
from .user_routes import router as user_router
from .user_preferences_routes import router as user_preferences_router
from .tenant_database_routes import router as tenant_database_router
from .health_routes import router as health_router
from .audit_routes import router as audit_router
from .cache_routes import router as cache_router
from .api_key_routes import router as api_key_router
from .navigation_routes import router as navigation_router
from .integration_routes import router as integration_router
from .workflow_routes import router as workflow_router
from .external_api_routes import router as external_api_router
from .company_address_routes import router as company_address_router
from .upload_routes import router as upload_router
from .rbac import role_router, group_router

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
    "company_address_router",
    "upload_router",
    "role_router",
    "group_router",
]

