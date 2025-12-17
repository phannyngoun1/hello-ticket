"""
Core Dependencies

Core platform dependencies (auth, tenant, etc.).
"""

from .auth_dependencies import *
from .api_key_dependencies import *
from .hybrid_auth_dependencies import *
from .tenant_dependencies import *

__all__ = [
    # Auth dependencies
    "get_current_user",
    "get_current_active_user",
    "require_admin",
    "RequirePermission",
    "RequireAnyPermission",
    "get_auth_service",
    # API Key dependencies
    "get_api_key",
    "RequireAPIKeyPermission",
    "RequireAnyAPIKeyPermission",
    # Hybrid auth dependencies
    "RequireAnyAuth",
    # Tenant dependencies
    "get_tenant_id_optional",
    "get_tenant_id_from_header",
]

