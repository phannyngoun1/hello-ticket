"""
Container and mediator registration for Session module.

This module handles all dependency injection and mediator registrations
for the Session domain service.
"""
from punq import Container
from app.domain.core.session.repository import SessionRepository
from app.infrastructure.core.session.repository import SQLSessionRepository
from app.application.core.session import SessionService


def register_session_container(container: Container) -> None:
    """
    Register all Session-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Session service
    
    Note: SessionService must be registered before AuthService as AuthService depends on it.
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register Session repository
    container.register(SessionRepository, instance=SQLSessionRepository())
    
    # Register SessionService
    session_service = SessionService(
        session_repository=container.resolve(SessionRepository)
    )
    container.register(SessionService, instance=session_service)
