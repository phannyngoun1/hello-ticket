"""
Container and mediator registration for EventSeat module.

This module handles all dependency injection and mediator registrations
for the EventSeat domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.ticketing.event_seat_repositories import EventSeatRepository
from app.domain.ticketing.event_repositories import EventRepository
from app.domain.ticketing.seat_repositories import SeatRepository
from app.domain.ticketing.ticket_repositories import TicketRepository
from app.infrastructure.ticketing.event_seat_repository import SQLEventSeatRepository
from app.application.ticketing.handlers_event_seat import EventSeatCommandHandler, EventSeatQueryHandler
from app.application.ticketing.commands_event_seat import (
    InitializeEventSeatsCommand,
    ImportBrokerSeatsCommand,
    DeleteEventSeatsCommand,
    CreateTicketsFromSeatsCommand,
    CreateEventSeatCommand,
    HoldEventSeatsCommand,
    UnholdEventSeatsCommand,
    UnblockEventSeatsCommand,
    BlockEventSeatsCommand,
)
from app.application.ticketing.queries_event_seat import GetEventSeatsQuery, GetEventSeatStatisticsQuery
from app.infrastructure.shared.database.connection import get_session_sync


def register_event_seat_container(container: Container) -> None:
    """
    Register all EventSeat-related dependencies in the container.
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register EventSeat repository
    event_seat_repository = SQLEventSeatRepository()
    container.register(EventSeatRepository, instance=event_seat_repository)

    # Get dependencies
    event_repository = container.resolve(EventRepository)
    seat_repository = container.resolve(SeatRepository)
    
    # Register Ticket repository
    from app.infrastructure.ticketing.ticket_repository import SQLTicketRepository
    ticket_repository = SQLTicketRepository()
    container.register(TicketRepository, instance=ticket_repository)

    # Register handlers
    event_seat_command_handler = EventSeatCommandHandler(
        event_repository=event_repository,
        seat_repository=seat_repository,
        event_seat_repository=event_seat_repository,
        ticket_repository=ticket_repository,
        session_factory=get_session_sync
    )
    container.register(EventSeatCommandHandler, instance=event_seat_command_handler)

    event_seat_query_handler = EventSeatQueryHandler(
        event_seat_repository=event_seat_repository
    )
    container.register(EventSeatQueryHandler, instance=event_seat_query_handler)


def register_event_seat_mediator(mediator: Mediator) -> None:
    """
    Register all EventSeat command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register command handlers
    mediator.register_command_handler(InitializeEventSeatsCommand, EventSeatCommandHandler)
    mediator.register_command_handler(ImportBrokerSeatsCommand, EventSeatCommandHandler)
    mediator.register_command_handler(DeleteEventSeatsCommand, EventSeatCommandHandler)
    mediator.register_command_handler(CreateTicketsFromSeatsCommand, EventSeatCommandHandler)
    mediator.register_command_handler(CreateEventSeatCommand, EventSeatCommandHandler)
    mediator.register_command_handler(HoldEventSeatsCommand, EventSeatCommandHandler)
    mediator.register_command_handler(UnholdEventSeatsCommand, EventSeatCommandHandler)
    mediator.register_command_handler(UnblockEventSeatsCommand, EventSeatCommandHandler)
    mediator.register_command_handler(BlockEventSeatsCommand, EventSeatCommandHandler)
    
    # Register query handlers
    mediator.register_query_handler(GetEventSeatsQuery, EventSeatQueryHandler)
    mediator.register_query_handler(GetEventSeatStatisticsQuery, EventSeatQueryHandler)