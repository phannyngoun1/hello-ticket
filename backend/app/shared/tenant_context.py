"""
Tenant context management for multi-tenancy
"""
from contextvars import ContextVar
from typing import Optional
from dataclasses import dataclass


# Context variable to store current tenant ID
_tenant_context: ContextVar[Optional[str]] = ContextVar('tenant_context', default=None)


@dataclass
class TenantContext:
    """Tenant context information"""
    tenant_id: str
    tenant_slug: Optional[str] = None


def set_tenant_context(tenant_id: str, tenant_slug: Optional[str] = None) -> None:
    """Set current tenant context"""
    _tenant_context.set(tenant_id)


def get_tenant_context() -> Optional[str]:
    """Get current tenant ID from context"""
    return _tenant_context.get()


def clear_tenant_context() -> None:
    """Clear tenant context"""
    _tenant_context.set(None)


def require_tenant_context() -> str:
    """Get tenant context or raise error if not set"""
    tenant_id = get_tenant_context()
    if tenant_id is None:
        raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
    return tenant_id

