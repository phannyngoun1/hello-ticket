"""
Shared Dependencies

Truly shared dependencies used across multiple modules.
"""

from .mediator_dependencies import get_mediator_dependency

__all__ = [
    "get_mediator_dependency",
]
