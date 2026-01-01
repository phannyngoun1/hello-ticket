"""
Container and mediator registration for Payment module.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.sales.payment_repositories import PaymentRepository
from app.application.sales.handlers_payment import PaymentCommandHandler
from app.infrastructure.sales.payment_repository import SQLPaymentRepository
from app.application.sales.commands_payment import CreatePaymentCommand
from app.domain.sales.booking_repositories import BookingRepository
from app.domain.ticketing.ticket_repositories import TicketRepository
from app.domain.ticketing.event_seat_repositories import EventSeatRepository
from app.infrastructure.ticketing.ticket_repository import SQLTicketRepository
from app.infrastructure.ticketing.event_seat_repository import SQLEventSeatRepository


def register_payment_container(container: Container) -> None:
    """
    Register all Payment-related dependencies in the container.
    """
    # Register Payment repository
    payment_repository = SQLPaymentRepository()
    container.register(PaymentRepository, instance=payment_repository)
    
    # Get booking repository
    booking_repository = container.resolve(BookingRepository)
    
    # Get or create ticket and event seat repositories
    try:
        ticket_repository = container.resolve(TicketRepository)
    except Exception:
        ticket_repository = SQLTicketRepository()
        container.register(TicketRepository, instance=ticket_repository)
    
    try:
        event_seat_repository = container.resolve(EventSeatRepository)
    except Exception:
        event_seat_repository = SQLEventSeatRepository()
        container.register(EventSeatRepository, instance=event_seat_repository)
    
    # Register Payment command handler
    payment_command_handler = PaymentCommandHandler(
        payment_repository=payment_repository,
        booking_repository=booking_repository,
        ticket_repository=ticket_repository,
        event_seat_repository=event_seat_repository,
    )
    container.register(PaymentCommandHandler, instance=payment_command_handler)


def register_payment_mediator(mediator: Mediator) -> None:
    """
    Register all Payment command handlers with the mediator.
    """
    mediator.register_command_handler(CreatePaymentCommand, PaymentCommandHandler)

