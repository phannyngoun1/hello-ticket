"""
Container and mediator registration for Auth module.

This module handles all dependency injection and mediator registrations
for the Auth domain service.
"""
from punq import Container
from app.domain.core.auth.repository import AuthRepository
from app.domain.core.session.repository import SessionRepository
from app.infrastructure.core.auth.repository import SQLAuthRepository
from app.infrastructure.shared.security.password_hasher import PasswordHasher
from app.infrastructure.shared.security.jwt_handler import JWTHandler
from app.application.core.auth import AuthService


def register_auth_container(container: Container) -> None:
    """
    Register all Auth-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Security infrastructure (password hasher, JWT handler)
    - Auth service
    
    Note: AuthService depends on SessionService, so SessionService must be
    registered before calling this function.
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register Auth repository
    container.register(AuthRepository, instance=SQLAuthRepository())
    
    # Register security infrastructure
    container.register(PasswordHasher, instance=PasswordHasher())
    container.register(JWTHandler, instance=JWTHandler())
    
    # Register AuthService and wire session service to avoid circular dependency
    from app.application.core.session import SessionService
    
    auth_service = AuthService(
        auth_repository=container.resolve(AuthRepository),
        password_hasher=container.resolve(PasswordHasher),
        jwt_handler=container.resolve(JWTHandler)
    )
    auth_service.set_session_service(container.resolve(SessionService))
    container.register(AuthService, instance=auth_service)
