"""
Container and mediator registration for Customer module (Sales domain).

This module handles all dependency injection and mediator registrations
for the Customer domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.sales.repositories import CustomerRepository
from app.domain.shared.tag_repository import TagLinkRepository, TagRepository
from app.infrastructure.sales.sql_customer_repository import SQLCustomerRepository
from app.infrastructure.shared.tag_repository import SQLTagLinkRepository, SQLTagRepository
from app.application.sales import (
    CustomerCommandHandler,
    CustomerQueryHandler,
    CreateCustomerCommand,
    UpdateCustomerCommand,
    DeleteCustomerCommand,
    GetCustomerByIdQuery,
    GetCustomerByCodeQuery,
    SearchCustomersQuery,
)


def register_customer_container(container: Container) -> None:
    """
    Register all Customer-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register TagLink repository (for tag management)
    tag_link_repository = SQLTagLinkRepository()
    container.register(TagLinkRepository, instance=tag_link_repository)
    
    # Register Tag repository (for tag lookup/creation)
    tag_repository = SQLTagRepository()
    container.register(TagRepository, instance=tag_repository)
    
    # Register Customer repository (SQL implementation) with TagLinkRepository
    customer_repository = SQLCustomerRepository(tag_link_repository=tag_link_repository)
    container.register(CustomerRepository, instance=customer_repository)
    
    # Register Customer command handler
    customer_command_handler = CustomerCommandHandler(
        customer_repository=customer_repository
    )
    container.register(CustomerCommandHandler, instance=customer_command_handler)
    
    # Register Customer query handler
    customer_query_handler = CustomerQueryHandler(customer_repository=customer_repository)
    container.register(CustomerQueryHandler, instance=customer_query_handler)


def register_customer_mediator(mediator: Mediator) -> None:
    """
    Register all Customer command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register Customer command handlers
    mediator.register_command_handler(CreateCustomerCommand, CustomerCommandHandler)
    mediator.register_command_handler(UpdateCustomerCommand, CustomerCommandHandler)
    mediator.register_command_handler(DeleteCustomerCommand, CustomerCommandHandler)
    
    # Register Customer query handlers
    mediator.register_query_handler(GetCustomerByIdQuery, CustomerQueryHandler)
    mediator.register_query_handler(GetCustomerByCodeQuery, CustomerQueryHandler)
    mediator.register_query_handler(SearchCustomersQuery, CustomerQueryHandler)
