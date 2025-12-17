"""
Container and mediator registration for Employee module.

This module handles all dependency injection and mediator registrations
for the Employee domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.warehouse.employee_repositories import EmployeeRepository
from app.application.warehouse.handlers_employee import EmployeeCommandHandler, EmployeeQueryHandler
from app.infrastructure.warehouse.employee_repository import SQLEmployeeRepository
from app.application.warehouse.commands_employee import (
    CreateEmployeeCommand,
    UpdateEmployeeCommand,
    DeleteEmployeeCommand,
)
from app.application.warehouse.queries_employee import (
    GetEmployeeByIdQuery,
    GetEmployeeByCodeQuery,
    SearchEmployeesQuery,
)



def register_employee_container(container: Container) -> None:
    """
    Register all Employee-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register Employee repository
    employee_repository = SQLEmployeeRepository()
    container.register(EmployeeRepository, instance=employee_repository)
    
    # Register Employee command handler
    employee_command_handler = EmployeeCommandHandler(
        employee_repository=employee_repository
    )
    container.register(EmployeeCommandHandler, instance=employee_command_handler)
    
    # Register Employee query handler
    employee_query_handler = EmployeeQueryHandler(
        employee_repository=employee_repository
    )
    container.register(EmployeeQueryHandler, instance=employee_query_handler)


def register_employee_mediator(mediator: Mediator) -> None:
    """
    Register all Employee command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register Employee command handlers
    mediator.register_command_handler(CreateEmployeeCommand, EmployeeCommandHandler)
    mediator.register_command_handler(UpdateEmployeeCommand, EmployeeCommandHandler)
    mediator.register_command_handler(DeleteEmployeeCommand, EmployeeCommandHandler)
    
    # Register Employee query handlers
    mediator.register_query_handler(GetEmployeeByIdQuery, EmployeeQueryHandler)
    mediator.register_query_handler(GetEmployeeByCodeQuery, EmployeeQueryHandler)
    mediator.register_query_handler(SearchEmployeesQuery, EmployeeQueryHandler)
