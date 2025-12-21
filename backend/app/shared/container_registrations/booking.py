"""
Container and mediator registration for Booking module.

This module handles all dependency injection and mediator registrations
for the Booking domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.sales.booking_repositories import BookingRepository
from app.application.sales.handlers_booking import BookingCommandHandler, BookingQueryHandler
from app.infrastructure.sales.booking_repository import SQLBookingRepository
from app.application.sales.commands_booking import (
    CreateBookingCommand,
    UpdateBookingCommand,
    DeleteBookingCommand,

)
from app.application.sales.queries_booking import (
    GetBookingByIdQuery,
    GetBookingByCodeQuery,
    SearchBookingsQuery,
)

from app.shared.services.code_generator import CodeGeneratorService


def register_booking_container(container: Container) -> None:
    """
    Register all Booking-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register Booking repository
    booking_repository = SQLBookingRepository()
    container.register(BookingRepository, instance=booking_repository)
    
    code_generator = container.resolve(CodeGeneratorService)
    # Register Booking command handler
    booking_command_handler = BookingCommandHandler(
        booking_repository=booking_repository,
        code_generator=code_generator
    )
    container.register(BookingCommandHandler, instance=booking_command_handler)
    
    # Register Booking query handler
    booking_query_handler = BookingQueryHandler(
        booking_repository=booking_repository
    )
    container.register(BookingQueryHandler, instance=booking_query_handler)


def register_booking_mediator(mediator: Mediator) -> None:
    """
    Register all Booking command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register Booking command handlers
    mediator.register_command_handler(CreateBookingCommand, BookingCommandHandler)
    mediator.register_command_handler(UpdateBookingCommand, BookingCommandHandler)
    mediator.register_command_handler(DeleteBookingCommand, BookingCommandHandler)

    
    # Register Booking query handlers
    mediator.register_query_handler(GetBookingByIdQuery, BookingQueryHandler)
    mediator.register_query_handler(GetBookingByCodeQuery, BookingQueryHandler)
    mediator.register_query_handler(SearchBookingsQuery, BookingQueryHandler)
