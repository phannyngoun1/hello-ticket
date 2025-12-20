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
from app.shared.container_registrations.inventory import register_inventory_container, register_inventory_mediator
from app.shared.container_registrations.customer import register_customer_container, register_customer_mediator
from app.shared.container_registrations.customer_type import register_customer_type_container, register_customer_type_mediator
from app.shared.container_registrations.customer_group import register_customer_group_container, register_customer_group_mediator
from app.shared.container_registrations.test_tree import register_test_tree_container, register_test_tree_mediator
from app.shared.container_registrations.test import register_test_container, register_test_mediator
from app.shared.container_registrations.test_basic import register_test_basic_container, register_test_basic_mediator
from app.shared.container_registrations.venue import register_venue_container, register_venue_mediator
from app.shared.container_registrations.seat import register_seat_container, register_seat_mediator
from app.shared.container_registrations.organizer import register_organizer_container, register_organizer_mediator
from app.shared.container_registrations.event_type import register_event_type_container, register_event_type_mediator
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
    
    # Domain modules
    register_inventory_container(container)
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
    # Seats (depends on Venue)
    register_seat_container(container)
    # Ticketing - Organizers
    register_organizer_container(container)

    # Ticketing - Event Types
    register_event_type_container(container)

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
    register_inventory_mediator(mediator)
    register_customer_mediator(mediator)
    register_customer_type_mediator(mediator)
    register_customer_group_mediator(mediator)
    register_test_tree_mediator(mediator)
    register_test_mediator(mediator)
    register_test_basic_mediator(mediator)
    register_venue_mediator(mediator)
    register_seat_mediator(mediator)
    register_organizer_mediator(mediator)
    register_event_type_mediator(mediator)
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

