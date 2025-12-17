"""
Container and mediator registration for CustomerGroup module.

This module handles all dependency injection and mediator registrations
for the CustomerGroup domain entity (tree structure).
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.sales.customer_group_repositories import CustomerGroupRepository
from app.application.sales.handlers_customer_group import CustomerGroupCommandHandler, CustomerGroupQueryHandler
from app.infrastructure.sales.customer_group_repository import SQLCustomerGroupRepository
from app.application.sales.commands_customer_group import (
    CreateCustomerGroupCommand,
    UpdateCustomerGroupCommand,
    DeleteCustomerGroupCommand,
)
from app.application.sales.queries_customer_group import (
    GetCustomerGroupByIdQuery,
    GetCustomerGroupByCodeQuery,
    SearchCustomerGroupsQuery,
    GetCustomerGroupTreeQuery,
    GetCustomerGroupChildrenQuery,
)



def register_customer_group_container(container: Container) -> None:
    """
    Register all CustomerGroup-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register CustomerGroup repository
    customer_group_repository = SQLCustomerGroupRepository()
    container.register(CustomerGroupRepository, instance=customer_group_repository)
    
    # Register CustomerGroup command handler
    customer_group_command_handler = CustomerGroupCommandHandler(
        customer_group_repository=customer_group_repository
    )
    container.register(CustomerGroupCommandHandler, instance=customer_group_command_handler)
    
    # Register CustomerGroup query handler
    customer_group_query_handler = CustomerGroupQueryHandler(
        customer_group_repository=customer_group_repository
    )
    container.register(CustomerGroupQueryHandler, instance=customer_group_query_handler)


def register_customer_group_mediator(mediator: Mediator) -> None:
    """
    Register all CustomerGroup command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register CustomerGroup command handlers
    mediator.register_command_handler(CreateCustomerGroupCommand, CustomerGroupCommandHandler)
    mediator.register_command_handler(UpdateCustomerGroupCommand, CustomerGroupCommandHandler)
    mediator.register_command_handler(DeleteCustomerGroupCommand, CustomerGroupCommandHandler)
    
    # Register CustomerGroup query handlers
    mediator.register_query_handler(GetCustomerGroupByIdQuery, CustomerGroupQueryHandler)
    mediator.register_query_handler(GetCustomerGroupByCodeQuery, CustomerGroupQueryHandler)
    mediator.register_query_handler(SearchCustomerGroupsQuery, CustomerGroupQueryHandler)
    mediator.register_query_handler(GetCustomerGroupTreeQuery, CustomerGroupQueryHandler)
    mediator.register_query_handler(GetCustomerGroupChildrenQuery, CustomerGroupQueryHandler)
