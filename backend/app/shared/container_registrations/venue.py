"""
Container and mediator registration for Venue module.

This module handles all dependency injection and mediator registrations
for the Venue domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.ticketing.venue_repositories import VenueRepository
from app.application.ticketing.handlers_venue import VenueCommandHandler, VenueQueryHandler
from app.infrastructure.ticketing.venue_repository import SQLVenueRepository
from app.application.ticketing.commands_venue import (
    CreateVenueCommand,
    UpdateVenueCommand,
    DeleteVenueCommand,

)
from app.application.ticketing.queries_venue import (
    GetVenueByIdQuery,
    GetVenueByCodeQuery,
    SearchVenuesQuery,
)

from app.shared.services.code_generator import CodeGeneratorService


def register_venue_container(container: Container) -> None:
    """
    Register all Venue-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register Venue repository
    venue_repository = SQLVenueRepository()
    container.register(VenueRepository, instance=venue_repository)
    
    code_generator = container.resolve(CodeGeneratorService)
    # Register Venue command handler
    venue_command_handler = VenueCommandHandler(
        venue_repository=venue_repository,
        code_generator=code_generator
    )
    container.register(VenueCommandHandler, instance=venue_command_handler)
    
    # Register Venue query handler
    venue_query_handler = VenueQueryHandler(
        venue_repository=venue_repository
    )
    container.register(VenueQueryHandler, instance=venue_query_handler)


def register_venue_mediator(mediator: Mediator) -> None:
    """
    Register all Venue command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register Venue command handlers
    mediator.register_command_handler(CreateVenueCommand, VenueCommandHandler)
    mediator.register_command_handler(UpdateVenueCommand, VenueCommandHandler)
    mediator.register_command_handler(DeleteVenueCommand, VenueCommandHandler)

    
    # Register Venue query handlers
    mediator.register_query_handler(GetVenueByIdQuery, VenueQueryHandler)
    mediator.register_query_handler(GetVenueByCodeQuery, VenueQueryHandler)
    mediator.register_query_handler(SearchVenuesQuery, VenueQueryHandler)
