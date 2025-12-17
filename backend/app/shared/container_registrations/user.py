"""
Container and mediator registration for User module.

This module handles all dependency injection and mediator registrations
for the User domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.core.user.repository import UserRepository
from app.domain.core.user.preference_repository import UserPreferenceRepository
from app.infrastructure.core.user.repository import SQLUserRepository
from app.infrastructure.core.user.preference_repository import SQLUserPreferenceRepository
from app.application.core.user import (
    UserCommandHandler,
    UserQueryHandler,
    CreateUserCommand,
    UpdateUserCommand,
    DeleteUserCommand,
    ActivateUserCommand,
    DeactivateUserCommand,
    GetUserByIdQuery,
    GetUserByEmailQuery,
    GetAllUsersQuery,
    SearchUsersQuery,
    UserExistsQuery,
    ComplexUsersQuery,
)


def register_user_container(container: Container) -> None:
    """
    Register all User-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register User repository
    container.register(UserRepository, instance=SQLUserRepository())
    
    # Register User Preference repository
    container.register(UserPreferenceRepository, instance=SQLUserPreferenceRepository())
    
    # Register User command handler
    container.register(UserCommandHandler)
    
    # Register User query handler
    container.register(UserQueryHandler)


def register_user_mediator(mediator: Mediator) -> None:
    """
    Register all User command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register User command handlers
    mediator.register_command_handler(CreateUserCommand, UserCommandHandler)
    mediator.register_command_handler(UpdateUserCommand, UserCommandHandler)
    mediator.register_command_handler(DeleteUserCommand, UserCommandHandler)
    mediator.register_command_handler(ActivateUserCommand, UserCommandHandler)
    mediator.register_command_handler(DeactivateUserCommand, UserCommandHandler)
    
    # Register User query handlers
    mediator.register_query_handler(GetUserByIdQuery, UserQueryHandler)
    mediator.register_query_handler(GetUserByEmailQuery, UserQueryHandler)
    mediator.register_query_handler(GetAllUsersQuery, UserQueryHandler)
    mediator.register_query_handler(SearchUsersQuery, UserQueryHandler)
    mediator.register_query_handler(UserExistsQuery, UserQueryHandler)
    mediator.register_query_handler(ComplexUsersQuery, UserQueryHandler)
