"""
Dependency injection container using Punq

Author: Phanny
"""
import os
from punq import Container

# Import Mediator
from app.shared.mediator import Mediator

# Import registration functions
from app.shared.container_registrations.user import register_user_container, register_user_mediator
from app.shared.container_registrations.session import register_session_container
from app.shared.container_registrations.auth import register_auth_container
from app.shared.container_registrations.audit import register_audit_container
from app.shared.container_registrations.code_generator import register_code_generator_container
from app.shared.container_registrations.customer import register_customer_container, register_customer_mediator
from app.shared.container_registrations.customer_type import register_customer_type_container, register_customer_type_mediator
from app.shared.container_registrations.customer_group import register_customer_group_container, register_customer_group_mediator
from app.shared.container_registrations.test_tree import register_test_tree_container, register_test_tree_mediator
from app.shared.container_registrations.test import register_test_container, register_test_mediator
from app.shared.container_registrations.test_basic import register_test_basic_container, register_test_basic_mediator
from app.shared.container_registrations.venue import register_venue_container, register_venue_mediator
from app.shared.container_registrations.layout import register_layout_container, register_layout_mediator
from app.shared.container_registrations.seat import register_seat_container, register_seat_mediator
from app.shared.container_registrations.organizer import register_organizer_container, register_organizer_mediator
from app.shared.container_registrations.event_type import register_event_type_container, register_event_type_mediator
from app.shared.container_registrations.booking import register_booking_container, register_booking_mediator
from app.shared.container_registrations.payment import register_payment_container, register_payment_mediator
from app.shared.container_registrations.show import register_show_container, register_show_mediator
from app.shared.container_registrations.event import register_event_container, register_event_mediator
from app.shared.container_registrations.event_seat import register_event_seat_container, register_event_seat_mediator
from app.shared.container_registrations.tag import register_tag_container, register_tag_mediator
from app.shared.container_registrations.attachment import register_attachment_container, register_attachment_mediator
from app.shared.container_registrations.venue_type import register_venue_type_container, register_venue_type_mediator
from app.shared.container_registrations.dashboard import register_dashboard_container, register_dashboard_mediator
def setup_container() -> Container:
    """Set up dependency injection container"""
    container = Container()
    
    # Check if caching is enabled via environment variable
    enable_cache = os.getenv("ENABLE_REDIS_CACHE", "true").lower() == "true"
    
    # Register modules in dependency order
    # Core modules (user, session, auth)
    register_user_container(container)
    register_session_container(container)
    register_audit_container(container)
    register_auth_container(container)  # Depends on session
    
    # Shared services
    register_code_generator_container(container)
    
    # Shared domain modules (tags and attachments - must be registered before entities that use them)
    register_tag_container(container)
    register_attachment_container(container)
    
    # Domain modules
    register_customer_container(container)

    # Sales modules

    register_customer_type_container(container)
    register_customer_group_container(container)

    # Sales - Test Trees
    register_test_tree_container(container)

    # Sales - Tests
    register_test_container(container)
    # Sales - Test Basics
    register_test_basic_container(container)    

    # Venues
    register_venue_container(container)
    # Layouts (depends on Venue)
    register_layout_container(container)
    # Seats (depends on Venue and Layout)
    register_seat_container(container)
    # Ticketing - Organizers
    register_organizer_container(container)

    # Ticketing - Event Types
    register_event_type_container(container)

    #bookings
    register_booking_container(container)
    #payments (depends on bookings)
    register_payment_container(container)

    #shows
    register_show_container(container)

    #events
    register_event_container(container)
    #event-seats
    register_event_seat_container(container)

    #venue types
    register_venue_type_container(container)

    #dashboard
    register_dashboard_container(container)

    return container

def setup_mediator(container: Container) -> Mediator:
    """
    Set up mediator with all command and query handler registrations
    
    Args:
        container: Punq container with registered handlers
        
    Returns:
        Configured mediator instance
    """
    mediator = Mediator(container)
    
    # Register module mediators
    register_user_mediator(mediator)
    register_tag_mediator(mediator)  # Tags must be registered before entities that use them
    register_attachment_mediator(mediator)  # Attachments must be registered before entities that use them
    register_customer_mediator(mediator)
    register_customer_type_mediator(mediator)
    register_customer_group_mediator(mediator)
    register_test_tree_mediator(mediator)
    register_test_mediator(mediator)
    register_test_basic_mediator(mediator)
    register_venue_mediator(mediator)
    register_layout_mediator(mediator)
    register_seat_mediator(mediator)
    register_organizer_mediator(mediator)
    register_event_type_mediator(mediator)
    register_booking_mediator(mediator)
    register_payment_mediator(mediator)
    register_show_mediator(mediator)
    register_event_mediator(mediator)
    register_event_seat_mediator(mediator)
    register_venue_type_mediator(mediator)
    register_dashboard_mediator(mediator)
    return mediator


# Global container instance
container = setup_container()

# Global mediator instance
_mediator = setup_mediator(container)


def get_mediator() -> Mediator:
    """
    Get the global mediator instance
    
    Returns:
        Configured mediator instance
    """
    return _mediator


def get_container() -> Container:
    """
    Get the global container instance
    
    Returns:
        Configured container instance
    """
    return container

