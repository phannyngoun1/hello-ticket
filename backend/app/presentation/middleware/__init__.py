"""
Presentation layer middleware
"""
from app.presentation.middleware.tenant_middleware import TenantMiddleware

__all__ = ["TenantMiddleware"]

