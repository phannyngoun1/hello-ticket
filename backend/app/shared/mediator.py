"""
Mediator pattern implementation for CQRS
Handles routing of commands and queries to their appropriate handlers
"""
import logging
import os
from typing import Any, Dict, Type, TypeVar, Optional
from punq import Container

logger = logging.getLogger(__name__)


TCommand = TypeVar('TCommand')
TQuery = TypeVar('TQuery')
TResult = TypeVar('TResult')


class NoHandlerRegisteredException(Exception):
    """Raised when no handler is registered for a command or query"""
    pass


from typing import Generic

class Handler(Generic[TCommand, TResult]):
    """
    Base class for handlers.
    
    This is primarily a marker class for type hints, as the Mediator 
    doesn't strictly enforce inheritance.
    """
    pass


class Mediator:
    """
    Mediator for routing commands and queries to their handlers.
    Uses dependency injection container to resolve handlers.
    """
    
    def __init__(self, container: Container):
        """
        Initialize mediator with a dependency injection container
        
        Args:
            container: Punq container with registered handlers
        """
        self._container = container
        self._command_handlers: Dict[Type, Type] = {}
        self._query_handlers: Dict[Type, Type] = {}
        self._is_dev_mode = os.getenv("ENVIRONMENT", "development").lower() == "development"
    
    def register_command_handler(self, command_type: Type[TCommand], handler_type: Type) -> None:
        """
        Register a command handler for a specific command type
        
        Args:
            command_type: The command class type
            handler_type: The handler class type that processes this command
        """
        self._command_handlers[command_type] = handler_type
    
    def register_query_handler(self, query_type: Type[TQuery], handler_type: Type) -> None:
        """
        Register a query handler for a specific query type
        
        Args:
            query_type: The query class type
            handler_type: The handler class type that processes this query
        """
        self._query_handlers[query_type] = handler_type
    
    async def send(self, command: TCommand) -> TResult:
        """
        Send a command to its registered handler
        
        Args:
            command: The command instance to process
            
        Returns:
            Result from the command handler
            
        Raises:
            NoHandlerRegisteredException: If no handler is registered for the command type
        """
        command_type = type(command)
        handler_type = self._command_handlers.get(command_type)
        
        if not handler_type:
            raise NoHandlerRegisteredException(
                f"No handler registered for command: {command_type.__name__}"
            )
        
        # Resolve handler from container
        handler = self._container.resolve(handler_type)
        
        # Log in development mode
        if self._is_dev_mode:
            logger.debug(f"📤 Sending command: {command_type.__name__} → {handler_type.__name__}")
        
        # Find the appropriate handle method
        return await self._invoke_handler(handler, command)
    
    async def query(self, query: TQuery) -> TResult:
        """
        Send a query to its registered handler
        
        Args:
            query: The query instance to process
            
        Returns:
            Result from the query handler
            
        Raises:
            NoHandlerRegisteredException: If no handler is registered for the query type
        """
        query_type = type(query)
        handler_type = self._query_handlers.get(query_type)
        
        if not handler_type:
            raise NoHandlerRegisteredException(
                f"No handler registered for query: {query_type.__name__}"
            )
        
        # Resolve handler from container
        handler = self._container.resolve(handler_type)
        
        # Log in development mode
        if self._is_dev_mode:
            logger.debug(f"🔍 Executing query: {query_type.__name__} → {handler_type.__name__}")
        
        # Find the appropriate handle method
        return await self._invoke_handler(handler, query)
    
    async def _invoke_handler(self, handler: Any, message: Any) -> Any:
        """
        Invoke the appropriate handler method based on the message type
        
        Args:
            handler: Handler instance
            message: Command or query instance
            
        Returns:
            Result from the handler method
        """
        # Try to find a specific handle method for this command/query type
        message_class_name = type(message).__name__
        handler_class_name = type(handler).__name__
        
        # Convert command/query class name to handler method name
        # e.g., CreateProductCommand -> handle_create_product
        # e.g., GetProductByIdQuery -> handle_get_product_by_id
        method_name = self._get_handler_method_name(message_class_name)
        
        # Log in development mode
        if self._is_dev_mode:
            logger.debug(f"Invoking handler: {handler_class_name}.{method_name}()")
        
        if hasattr(handler, method_name):
            method = getattr(handler, method_name)
            return await method(message)
        
        # Fallback to generic handle method if it exists
        if hasattr(handler, 'handle'):
            if self._is_dev_mode:
                logger.info(f"⚙️  Invoking fallback handler method: {handler_class_name}.handle()")
            return await handler.handle(message)
        
        raise AttributeError(
            f"Handler {handler_class_name} has no method '{method_name}' or 'handle'"
        )
    
    def _get_handler_method_name(self, class_name: str) -> str:
        """
        Convert command/query class name to handler method name
        
        Examples:
            CreateProductCommand -> handle_create_product
            GetProductByIdQuery -> handle_get_product_by_id
        """
        # Remove 'Command' or 'Query' suffix
        name = class_name
        if name.endswith('Command'):
            name = name[:-7]  # Remove 'Command'
        elif name.endswith('Query'):
            name = name[:-5]  # Remove 'Query'
        
        # Convert PascalCase to snake_case
        import re
        snake_case = re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()
        
        return f"handle_{snake_case}"
    
    def get_registered_commands(self) -> Dict[Type, Type]:
        """Get all registered command handlers"""
        return self._command_handlers.copy()
    
    def get_registered_queries(self) -> Dict[Type, Type]:
        """Get all registered query handlers"""
        return self._query_handlers.copy()

