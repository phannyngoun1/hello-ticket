"""
Container and mediator registration for CustomerType module.

This module handles all dependency injection and mediator registrations
for the CustomerType domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.sales.customer_type_repositories import CustomerTypeRepository
from app.application.sales.handlers_customer_type import CustomerTypeCommandHandler, CustomerTypeQueryHandler
from app.infrastructure.sales.customer_type_repository import SQLCustomerTypeRepository
from app.application.sales.commands_customer_type import (
    CreateCustomerTypeCommand,
    UpdateCustomerTypeCommand,
    DeleteCustomerTypeCommand,
)
from app.application.sales.queries_customer_type import (
    GetCustomerTypeByIdQuery,
    GetCustomerTypeByCodeQuery,
    SearchCustomerTypesQuery,
)


def register_customer_type_container(container: Container) -> None:
    """
    Register all CustomerType-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register CustomerType repository
    customer_type_repository = SQLCustomerTypeRepository()
    container.register(CustomerTypeRepository, instance=customer_type_repository)
    
    # Register CustomerType command handler
    customer_type_command_handler = CustomerTypeCommandHandler(
        customer_type_repository=customer_type_repository
    )
    container.register(CustomerTypeCommandHandler, instance=customer_type_command_handler)
    
    # Register CustomerType query handler
    customer_type_query_handler = CustomerTypeQueryHandler(
        customer_type_repository=customer_type_repository
    )
    container.register(CustomerTypeQueryHandler, instance=customer_type_query_handler)


def register_customer_type_mediator(mediator: Mediator) -> None:
    """
    Register all CustomerType command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register CustomerType command handlers
    mediator.register_command_handler(CreateCustomerTypeCommand, CustomerTypeCommandHandler)
    mediator.register_command_handler(UpdateCustomerTypeCommand, CustomerTypeCommandHandler)
    mediator.register_command_handler(DeleteCustomerTypeCommand, CustomerTypeCommandHandler)
    
    # Register CustomerType query handlers
    mediator.register_query_handler(GetCustomerTypeByIdQuery, CustomerTypeQueryHandler)
    mediator.register_query_handler(GetCustomerTypeByCodeQuery, CustomerTypeQueryHandler)
    mediator.register_query_handler(SearchCustomerTypesQuery, CustomerTypeQueryHandler)
