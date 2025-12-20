"""
Container and mediator registration for EventType module.

This module handles all dependency injection and mediator registrations
for the EventType domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.ticketing.event_type_repositories import EventTypeRepository
from app.application.ticketing.handlers_event_type import EventTypeCommandHandler, EventTypeQueryHandler
from app.infrastructure.ticketing.event_type_repository import SQLEventTypeRepository
from app.application.ticketing.commands_event_type import (
    CreateEventTypeCommand,
    UpdateEventTypeCommand,
    DeleteEventTypeCommand,
)
from app.application.ticketing.queries_event_type import (
    GetEventTypeByIdQuery,
    GetEventTypeByCodeQuery,
    SearchEventTypesQuery,
)



def register_event_type_container(container: Container) -> None:
    """
    Register all EventType-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register EventType repository
    event_type_repository = SQLEventTypeRepository()
    container.register(EventTypeRepository, instance=event_type_repository)
    
    # Register EventType command handler
    event_type_command_handler = EventTypeCommandHandler(
        event_type_repository=event_type_repository
    )
    container.register(EventTypeCommandHandler, instance=event_type_command_handler)
    
    # Register EventType query handler
    event_type_query_handler = EventTypeQueryHandler(
        event_type_repository=event_type_repository
    )
    container.register(EventTypeQueryHandler, instance=event_type_query_handler)


def register_event_type_mediator(mediator: Mediator) -> None:
    """
    Register all EventType command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register EventType command handlers
    mediator.register_command_handler(CreateEventTypeCommand, EventTypeCommandHandler)
    mediator.register_command_handler(UpdateEventTypeCommand, EventTypeCommandHandler)
    mediator.register_command_handler(DeleteEventTypeCommand, EventTypeCommandHandler)
    
    # Register EventType query handlers
    mediator.register_query_handler(GetEventTypeByIdQuery, EventTypeQueryHandler)
    mediator.register_query_handler(GetEventTypeByCodeQuery, EventTypeQueryHandler)
    mediator.register_query_handler(SearchEventTypesQuery, EventTypeQueryHandler)
