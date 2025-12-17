"""
User Application Layer

Exports all commands, queries, handlers, and services for the user module.
"""

# Import commands
from .commands import (
    CreateUserCommand,
    UpdateUserCommand,
    DeleteUserCommand,
    ActivateUserCommand,
    DeactivateUserCommand,
    LockUserCommand,
    UnlockUserCommand,
)

# Import queries
from .queries import (
    GetUserByIdQuery,
    GetUserByEmailQuery,
    GetAllUsersQuery,
    SearchUsersQuery,
    UserExistsQuery,
    ComplexUsersQuery,
)

# Import handlers
from .handlers import (
    UserCommandHandler,
    UserQueryHandler,
)

# Import services
from .services import (
    UserPermissionService,
    UserPreferenceService,
    UserSyncService,
)

__all__ = [
    # Commands
    "CreateUserCommand",
    "UpdateUserCommand",
    "DeleteUserCommand",
    "ActivateUserCommand",
    "DeactivateUserCommand",
    "LockUserCommand",
    "UnlockUserCommand",
    # Queries
    "GetUserByIdQuery",
    "GetUserByEmailQuery",
    "GetAllUsersQuery",
    "SearchUsersQuery",
    "UserExistsQuery",
    "ComplexUsersQuery",
    # Handlers
    "UserCommandHandler",
    "UserQueryHandler",
    # Services
    "UserPermissionService",
    "UserPreferenceService",
    "UserSyncService",
]

