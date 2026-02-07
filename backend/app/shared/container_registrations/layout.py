"""
Container and mediator registration for Layout module.

This module handles all dependency injection and mediator registrations
for the Layout domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.ticketing.layout_repositories import LayoutRepository
from app.domain.ticketing.venue_repositories import VenueRepository
from app.domain.ticketing.seat_repositories import SeatRepository
from app.application.ticketing.handlers_layout import LayoutCommandHandler, LayoutQueryHandler
from app.infrastructure.ticketing.layout_repository import SQLLayoutRepository


def register_layout_container(container: Container) -> None:
    """
    Register all Layout-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register Layout repository
    layout_repository = SQLLayoutRepository()
    container.register(LayoutRepository, instance=layout_repository)
    
    # Get Venue repository for Layout handlers
    venue_repository = container.resolve(VenueRepository)
    
    # Resolve or create SeatRepository for clone (sections + seats)
    from app.infrastructure.ticketing.seat_repository import SQLSeatRepository
    try:
        seat_repository = container.resolve(SeatRepository)
    except Exception:
        seat_repository = SQLSeatRepository()
        container.register(SeatRepository, instance=seat_repository)
    
    # Register Layout command handler
    layout_command_handler = LayoutCommandHandler(
        layout_repository=layout_repository,
        venue_repository=venue_repository,
        seat_repository=seat_repository,
    )
    container.register(LayoutCommandHandler, instance=layout_command_handler)
    
    # Register Layout query handler (reuse seat_repository from above)
    layout_query_handler = LayoutQueryHandler(
        layout_repository=layout_repository,
        seat_repository=seat_repository
    )
    container.register(LayoutQueryHandler, instance=layout_query_handler)


def register_layout_mediator(mediator: Mediator) -> None:
    """
    Register all Layout command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    from app.application.ticketing.commands_layout import (
        CreateLayoutCommand,
        UpdateLayoutCommand,
        DeleteLayoutCommand,
        CloneLayoutCommand,
    )
    from app.application.ticketing.queries_layout import (
        GetLayoutByIdQuery,
        GetLayoutsByVenueIdQuery,
        GetLayoutWithSeatsQuery,
    )
    
    # Register Layout command handlers
    mediator.register_command_handler(CreateLayoutCommand, LayoutCommandHandler)
    mediator.register_command_handler(UpdateLayoutCommand, LayoutCommandHandler)
    mediator.register_command_handler(DeleteLayoutCommand, LayoutCommandHandler)
    mediator.register_command_handler(CloneLayoutCommand, LayoutCommandHandler)
    
    # Register Layout query handlers
    mediator.register_query_handler(GetLayoutByIdQuery, LayoutQueryHandler)
    mediator.register_query_handler(GetLayoutsByVenueIdQuery, LayoutQueryHandler)
    mediator.register_query_handler(GetLayoutWithSeatsQuery, LayoutQueryHandler)
