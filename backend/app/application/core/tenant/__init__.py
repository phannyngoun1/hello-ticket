"""
Tenant Application Layer

Exports all commands, queries, and handlers for the tenant module.
"""

# Import commands
from .commands import (
    CreateTenantCommand,
    UpdateTenantCommand,
    DeactivateTenantCommand,
    ActivateTenantCommand,
    DeleteTenantCommand,
    CreateTenantWithAdminCommand,
)

# Import queries
from .queries import (
    GetTenantByIdQuery,
    GetTenantBySlugQuery,
    GetAllTenantsQuery,
)

# Import handlers
from .handlers import (
    TenantCommandHandler,
    TenantQueryHandler,
)

__all__ = [
    # Commands
    "CreateTenantCommand",
    "UpdateTenantCommand",
    "DeactivateTenantCommand",
    "ActivateTenantCommand",
    "DeleteTenantCommand",
    "CreateTenantWithAdminCommand",
    # Queries
    "GetTenantByIdQuery",
    "GetTenantBySlugQuery",
    "GetAllTenantsQuery",
    # Handlers
    "TenantCommandHandler",
    "TenantQueryHandler",
]

