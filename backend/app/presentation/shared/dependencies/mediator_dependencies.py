"""
Mediator dependencies for FastAPI
"""
from app.shared.mediator import Mediator
from app.shared.container import get_mediator


def get_mediator_dependency() -> Mediator:
    """
    FastAPI dependency to get mediator instance
    
    Returns:
        Mediator instance configured with all handlers
    """
    return get_mediator()

