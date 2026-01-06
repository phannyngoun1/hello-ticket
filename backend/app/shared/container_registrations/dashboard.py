"""
Container and mediator registration for Dashboard module.

This module handles all dependency injection and mediator registrations
for the Dashboard analytics functionality.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.ticketing.event_repositories import EventRepository
from app.domain.sales.booking_repositories import BookingRepository
from app.domain.sales.repositories import CustomerRepository
from app.domain.sales.payment_repositories import PaymentRepository
from app.domain.core.user.repository import UserRepository
from app.application.shared.handlers_dashboard import (
    GetDashboardAnalyticsHandler,
    GetRevenueAnalyticsHandler,
)
from app.application.shared.queries_dashboard import (
    GetDashboardAnalyticsQuery,
    GetRevenueAnalyticsQuery,
)


def register_dashboard_container(container: Container) -> None:
    """
    Register all Dashboard-related dependencies in the container.

    This includes:
    - Query handlers

    Args:
        container: The Punq container to register dependencies in
    """
    # Get existing repositories from container
    event_repository = container.resolve(EventRepository)
    booking_repository = container.resolve(BookingRepository)
    customer_repository = container.resolve(CustomerRepository)
    payment_repository = container.resolve(PaymentRepository)
    user_repository = container.resolve(UserRepository)

    # Register Dashboard analytics handler
    dashboard_handler = GetDashboardAnalyticsHandler(
        event_repository=event_repository,
        booking_repository=booking_repository,
        customer_repository=customer_repository,
        payment_repository=payment_repository,
        user_repository=user_repository,
    )
    container.register(GetDashboardAnalyticsHandler, instance=dashboard_handler)

    # Register Revenue analytics handler
    revenue_handler = GetRevenueAnalyticsHandler(
        booking_repository=booking_repository,
    )
    container.register(GetRevenueAnalyticsHandler, instance=revenue_handler)


def register_dashboard_mediator(mediator: Mediator) -> None:
    """
    Register all Dashboard query handlers with the mediator.

    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register Dashboard query handlers
    mediator.register_query_handler(GetDashboardAnalyticsQuery, GetDashboardAnalyticsHandler)
    mediator.register_query_handler(GetRevenueAnalyticsQuery, GetRevenueAnalyticsHandler)
