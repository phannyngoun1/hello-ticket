"""
Container and mediator registration for VenueType module.

This module handles all dependency injection and mediator registrations
for the VenueType domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.ticketing.venue_type_repositories import VenueTypeRepository
from app.application.ticketing.handlers_venue_type import VenueTypeCommandHandler, VenueTypeQueryHandler
from app.infrastructure.ticketing.venue_type_repository import SQLVenueTypeRepository
from app.application.ticketing.commands_venue_type import (
    CreateVenueTypeCommand,
    UpdateVenueTypeCommand,
    DeleteVenueTypeCommand,
)
from app.application.ticketing.queries_venue_type import (
    GetVenueTypeByIdQuery,
    GetVenueTypeByCodeQuery,
    SearchVenueTypesQuery,
)



def register_venue_type_container(container: Container) -> None:
    """
    Register all VenueType-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register VenueType repository
    venue_type_repository = SQLVenueTypeRepository()
    container.register(VenueTypeRepository, instance=venue_type_repository)
    
    # Register VenueType command handler
    venue_type_command_handler = VenueTypeCommandHandler(
        venue_type_repository=venue_type_repository
    )
    container.register(VenueTypeCommandHandler, instance=venue_type_command_handler)
    
    # Register VenueType query handler
    venue_type_query_handler = VenueTypeQueryHandler(
        venue_type_repository=venue_type_repository
    )
    container.register(VenueTypeQueryHandler, instance=venue_type_query_handler)


def register_venue_type_mediator(mediator: Mediator) -> None:
    """
    Register all VenueType command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register VenueType command handlers
    mediator.register_command_handler(CreateVenueTypeCommand, VenueTypeCommandHandler)
    mediator.register_command_handler(UpdateVenueTypeCommand, VenueTypeCommandHandler)
    mediator.register_command_handler(DeleteVenueTypeCommand, VenueTypeCommandHandler)
    
    # Register VenueType query handlers
    mediator.register_query_handler(GetVenueTypeByIdQuery, VenueTypeQueryHandler)
    mediator.register_query_handler(GetVenueTypeByCodeQuery, VenueTypeQueryHandler)
    mediator.register_query_handler(SearchVenueTypesQuery, VenueTypeQueryHandler)
