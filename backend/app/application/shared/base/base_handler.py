"""
Base handler interfaces for CQRS pattern
"""
from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar


# Type variables for commands, queries, and results
TCommand = TypeVar('TCommand')
TQuery = TypeVar('TQuery')
TResult = TypeVar('TResult')


class ICommandHandler(ABC, Generic[TCommand, TResult]):
    """Base interface for command handlers"""
    
    @abstractmethod
    async def handle(self, command: TCommand) -> TResult:
        """Handle a command and return result"""
        pass
    
    @classmethod
    @abstractmethod
    def command_type(cls) -> type:
        """Return the command type this handler processes"""
        pass


class IQueryHandler(ABC, Generic[TQuery, TResult]):
    """Base interface for query handlers"""
    
    @abstractmethod
    async def handle(self, query: TQuery) -> TResult:
        """Handle a query and return result"""
        pass
    
    @classmethod
    @abstractmethod
    def query_type(cls) -> type:
        """Return the query type this handler processes"""
        pass

