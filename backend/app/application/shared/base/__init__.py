"""
Shared base classes for application layer
"""
from .base_handler import ICommandHandler, IQueryHandler

__all__ = [
    "ICommandHandler",
    "IQueryHandler",
]

