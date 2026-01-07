"""
Container and mediator registration for Organizer module.

This module handles all dependency injection and mediator registrations
for the Organizer domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.ticketing.organizer_repositories import OrganizerRepository
from app.application.ticketing.handlers_organizer import OrganizerCommandHandler, OrganizerQueryHandler
from app.infrastructure.ticketing.organizer_repository import SQLOrganizerRepository
from app.application.ticketing.commands_organizer import (
    CreateOrganizerCommand,
    UpdateOrganizerCommand,
    DeleteOrganizerCommand,
)
from app.application.ticketing.queries_organizer import (
    GetOrganizerByIdQuery,
    GetOrganizerByCodeQuery,
    SearchOrganizersQuery,
    GetOrganizersByIdsQuery,
)

from app.shared.services.code_generator import CodeGeneratorService


def register_organizer_container(container: Container) -> None:
    """
    Register all Organizer-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register Organizer repository
    organizer_repository = SQLOrganizerRepository()
    container.register(OrganizerRepository, instance=organizer_repository)
    
    code_generator = container.resolve(CodeGeneratorService)
    # Register Organizer command handler
    organizer_command_handler = OrganizerCommandHandler(
        organizer_repository=organizer_repository,
        code_generator=code_generator
    )
    container.register(OrganizerCommandHandler, instance=organizer_command_handler)
    
    # Register Organizer query handler
    organizer_query_handler = OrganizerQueryHandler(
        organizer_repository=organizer_repository
    )
    container.register(OrganizerQueryHandler, instance=organizer_query_handler)


def register_organizer_mediator(mediator: Mediator) -> None:
    """
    Register all Organizer command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register Organizer command handlers
    mediator.register_command_handler(CreateOrganizerCommand, OrganizerCommandHandler)
    mediator.register_command_handler(UpdateOrganizerCommand, OrganizerCommandHandler)
    mediator.register_command_handler(DeleteOrganizerCommand, OrganizerCommandHandler)

    
    # Register Organizer query handlers
    mediator.register_query_handler(GetOrganizerByIdQuery, OrganizerQueryHandler)
    mediator.register_query_handler(GetOrganizerByCodeQuery, OrganizerQueryHandler)
    mediator.register_query_handler(SearchOrganizersQuery, OrganizerQueryHandler)
    mediator.register_query_handler(GetOrganizersByIdsQuery, OrganizerQueryHandler)
