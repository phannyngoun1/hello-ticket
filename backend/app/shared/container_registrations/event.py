"""
Container and mediator registration for Event module.

This module handles all dependency injection and mediator registrations
for the Event domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.ticketing.event_repositories import EventRepository
from app.application.ticketing.handlers_event import EventCommandHandler, EventQueryHandler
from app.infrastructure.ticketing.event_repository import SQLEventRepository
from app.application.ticketing.commands_event import (
    CreateEventCommand,
    UpdateEventCommand,
    DeleteEventCommand,
)
from app.application.ticketing.queries_event import (
    GetEventByIdQuery,
    GetEventByCodeQuery,
    SearchEventsQuery,
)



def register_event_container(container: Container) -> None:
    """
    Register all Event-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register Event repository
    event_repository = SQLEventRepository()
    container.register(EventRepository, instance=event_repository)
    
    # Register Event command handler
    event_command_handler = EventCommandHandler(
        event_repository=event_repository
    )
    container.register(EventCommandHandler, instance=event_command_handler)
    
    # Register Event query handler
    event_query_handler = EventQueryHandler(
        event_repository=event_repository
    )
    container.register(EventQueryHandler, instance=event_query_handler)


def register_event_mediator(mediator: Mediator) -> None:
    """
    Register all Event command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register Event command handlers
    mediator.register_command_handler(CreateEventCommand, EventCommandHandler)
    mediator.register_command_handler(UpdateEventCommand, EventCommandHandler)
    mediator.register_command_handler(DeleteEventCommand, EventCommandHandler)
    
    # Register Event query handlers
    mediator.register_query_handler(GetEventByIdQuery, EventQueryHandler)
    mediator.register_query_handler(GetEventByCodeQuery, EventQueryHandler)
    mediator.register_query_handler(SearchEventsQuery, EventQueryHandler)
