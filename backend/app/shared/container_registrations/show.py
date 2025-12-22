"""
Container and mediator registration for Show module.

This module handles all dependency injection and mediator registrations
for the Show domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.ticketing.show_repositories import ShowRepository
from app.domain.ticketing.organizer_repositories import OrganizerRepository
from app.application.ticketing.handlers_show import ShowCommandHandler, ShowQueryHandler
from app.infrastructure.ticketing.show_repository import SQLShowRepository
from app.infrastructure.ticketing.organizer_repository import SQLOrganizerRepository
from app.application.ticketing.commands_show import (
    CreateShowCommand,
    UpdateShowCommand,
    DeleteShowCommand,

)
from app.application.ticketing.queries_show import (
    GetShowByIdQuery,
    GetShowByCodeQuery,
    SearchShowsQuery,
)

from app.shared.services.code_generator import CodeGeneratorService


def register_show_container(container: Container) -> None:
    """
    Register all Show-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register Show repository
    show_repository = SQLShowRepository()
    container.register(ShowRepository, instance=show_repository)
    
    # Get or create Organizer repository (for validation)
    # Try to resolve if already registered, otherwise create new instance
    try:
        organizer_repository = container.resolve(OrganizerRepository)
    except Exception:
        # If not registered yet, create and register it
        organizer_repository = SQLOrganizerRepository()
        container.register(OrganizerRepository, instance=organizer_repository)
    
    code_generator = container.resolve(CodeGeneratorService)
    # Register Show command handler
    show_command_handler = ShowCommandHandler(
        show_repository=show_repository,
        organizer_repository=organizer_repository,
        code_generator=code_generator
    )
    container.register(ShowCommandHandler, instance=show_command_handler)
    
    # Register Show query handler
    show_query_handler = ShowQueryHandler(
        show_repository=show_repository
    )
    container.register(ShowQueryHandler, instance=show_query_handler)


def register_show_mediator(mediator: Mediator) -> None:
    """
    Register all Show command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register Show command handlers
    mediator.register_command_handler(CreateShowCommand, ShowCommandHandler)
    mediator.register_command_handler(UpdateShowCommand, ShowCommandHandler)
    mediator.register_command_handler(DeleteShowCommand, ShowCommandHandler)

    
    # Register Show query handlers
    mediator.register_query_handler(GetShowByIdQuery, ShowQueryHandler)
    mediator.register_query_handler(GetShowByCodeQuery, ShowQueryHandler)
    mediator.register_query_handler(SearchShowsQuery, ShowQueryHandler)
