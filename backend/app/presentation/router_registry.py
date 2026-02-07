"""
API routes registry - centralizes router management

Author: Phanny
"""
# Import routers from modular structure
from app.presentation.core import (
    auth_router,
    session_router,
    tenant_router,
    user_router,
    user_preferences_router,
    tenant_database_router,
    role_router,
    group_router,
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
)
from app.presentation.sales import sales_router
from app.presentation.shared.dependencies import get_mediator_dependency    
from app.presentation.shared.routes import enum_router, attachment_router
from app.presentation.shared.routes.tag_routes import router as tag_router
from app.presentation.shared.routes.dashboard_routes import router as dashboard_router
from app.presentation.ticketing import ticketing_router
# Router registry - add new routers here
# Order matters: health and auth routes should typically come first
ROUTERS = [
    health_router,
    tenant_router,  # Tenant management should come early
    tenant_database_router,  # Tenant database management
    auth_router,
    session_router,  # Session management
    user_router,
    group_router,  # Group management (RBAC)
    role_router,  # Custom role management (RBAC)
    sales_router,  # Sales (customers)
    integration_router,
    workflow_router,
    api_key_router,
    external_api_router,
    upload_router,  # File upload management
    ai_router,  # AI: form suggest, improve text, marker detection
    cache_router,
    audit_router,  # Audit logs and user activity
    user_preferences_router,  # User preferences management
    navigation_router,  # Centralized navigation
    enum_router,  # Enum values and options for frontend
    tag_router,  # Tag management (shared)
    attachment_router,  # Attachment management (shared)
    dashboard_router,  # Dashboard analytics
    ticketing_router,  # Ticketing module

]


def register_routers(app):
    """
    Register all application routers with /api/v1/ prefix (except health routes)
    
    Usage:
        from app.presentation.router_registry import register_routers
        register_routers(app)
    
    To add a new router:
        1. Import the router module at the top of this file
        2. Add router_module.router to the ROUTERS list
    
    Args:
        app: FastAPI application instance
    """
    for router in ROUTERS:
        # Health routes don't use /api/v1/ prefix
        if router == health_router:
            app.include_router(router)
        else:
            # All other routes get /api/v1/ prefix automatically
            # Router prefixes should be relative (e.g., "/roles", "/groups")
            # This function adds "/api/v1" to make them "/api/v1/roles", "/api/v1/groups", etc.
            app.include_router(router, prefix="/api/v1")
