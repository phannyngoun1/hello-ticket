"""
Session Application Layer

Exports all commands, queries, handlers, and services for the session module.
"""

# Import commands
from .commands import (
    CreateSessionCommand,
    RevokeSessionCommand,
    ForceLogoutSessionCommand,
    RevokeAllUserSessionsCommand,
    UpdateSessionActivityCommand,
    CleanupExpiredSessionsCommand,
)

# Import queries
from .queries import (
    GetSessionQuery,
    GetUserSessionsQuery,
    GetSessionInfoQuery,
    ValidateSessionQuery,
    GetSessionsByDeviceTypeQuery,
    GetSessionsByIPQuery,
    CountActiveSessionsQuery,
)

# Import handlers
from .handlers import (
    CreateSessionCommandHandler,
    RevokeSessionCommandHandler,
    ForceLogoutSessionCommandHandler,
    RevokeAllUserSessionsCommandHandler,
    UpdateSessionActivityCommandHandler,
    CleanupExpiredSessionsCommandHandler,
    GetSessionQueryHandler,
    GetUserSessionsQueryHandler,
    GetSessionInfoQueryHandler,
    ValidateSessionQueryHandler,
    GetSessionsByDeviceTypeQueryHandler,
    GetSessionsByIPQueryHandler,
    CountActiveSessionsQueryHandler,
)

# Import services
from .services import (
    SessionService,
    SessionConfig,
)

__all__ = [
    # Commands
    "CreateSessionCommand",
    "RevokeSessionCommand",
    "ForceLogoutSessionCommand",
    "RevokeAllUserSessionsCommand",
    "UpdateSessionActivityCommand",
    "CleanupExpiredSessionsCommand",
    # Queries
    "GetSessionQuery",
    "GetUserSessionsQuery",
    "GetSessionInfoQuery",
    "ValidateSessionQuery",
    "GetSessionsByDeviceTypeQuery",
    "GetSessionsByIPQuery",
    "CountActiveSessionsQuery",
    # Handlers
    "CreateSessionCommandHandler",
    "RevokeSessionCommandHandler",
    "ForceLogoutSessionCommandHandler",
    "RevokeAllUserSessionsCommandHandler",
    "UpdateSessionActivityCommandHandler",
    "CleanupExpiredSessionsCommandHandler",
    "GetSessionQueryHandler",
    "GetUserSessionsQueryHandler",
    "GetSessionInfoQueryHandler",
    "ValidateSessionQueryHandler",
    "GetSessionsByDeviceTypeQueryHandler",
    "GetSessionsByIPQueryHandler",
    "CountActiveSessionsQueryHandler",
    # Services
    "SessionService",
    "SessionConfig",
]

