"""
Container and mediator registration for Seat module.

This module handles all dependency injection and mediator registrations
for the Seat domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.ticketing.seat_repositories import SeatRepository
from app.domain.ticketing.venue_repositories import VenueRepository
from app.application.ticketing.handlers_seat import SeatCommandHandler, SeatQueryHandler
from app.infrastructure.ticketing.seat_repository import SQLSeatRepository
from app.application.ticketing.commands_seat import (
    CreateSeatCommand,
    UpdateSeatCommand,
    UpdateSeatCoordinatesCommand,
    DeleteSeatCommand,
    BulkCreateSeatsCommand,
    DeleteSeatsByVenueCommand,
)
from app.application.ticketing.queries_seat import (
    GetSeatByIdQuery,
    GetSeatsByVenueQuery,
    GetSeatByLocationQuery,
)


def register_seat_container(container: Container) -> None:
    """
    Register all Seat-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register Seat repository
    seat_repository = SQLSeatRepository()
    container.register(SeatRepository, instance=seat_repository)
    
    # Get VenueRepository from container
    venue_repository = container.resolve(VenueRepository)
    
    # Register Seat command handler
    seat_command_handler = SeatCommandHandler(
        seat_repository=seat_repository,
        venue_repository=venue_repository
    )
    container.register(SeatCommandHandler, instance=seat_command_handler)
    
    # Register Seat query handler
    seat_query_handler = SeatQueryHandler(
        seat_repository=seat_repository
    )
    container.register(SeatQueryHandler, instance=seat_query_handler)


def register_seat_mediator(mediator: Mediator) -> None:
    """
    Register all Seat command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register Seat command handlers
    mediator.register_command_handler(CreateSeatCommand, SeatCommandHandler)
    mediator.register_command_handler(UpdateSeatCommand, SeatCommandHandler)
    mediator.register_command_handler(UpdateSeatCoordinatesCommand, SeatCommandHandler)
    mediator.register_command_handler(DeleteSeatCommand, SeatCommandHandler)
    mediator.register_command_handler(BulkCreateSeatsCommand, SeatCommandHandler)
    mediator.register_command_handler(DeleteSeatsByVenueCommand, SeatCommandHandler)
    
    # Register Seat query handlers
    mediator.register_query_handler(GetSeatByIdQuery, SeatQueryHandler)
    mediator.register_query_handler(GetSeatsByVenueQuery, SeatQueryHandler)
    mediator.register_query_handler(GetSeatByLocationQuery, SeatQueryHandler)
