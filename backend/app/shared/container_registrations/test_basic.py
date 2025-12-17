"""
Container and mediator registration for TestBasic module.

This module handles all dependency injection and mediator registrations
for the TestBasic domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.sales.test_basic_repositories import TestBasicRepository
from app.application.sales.handlers_test_basic import TestBasicCommandHandler, TestBasicQueryHandler
from app.infrastructure.sales.test_basic_repository import SQLTestBasicRepository
from app.application.sales.commands_test_basic import (
    CreateTestBasicCommand,
    UpdateTestBasicCommand,
    DeleteTestBasicCommand,
)
from app.application.sales.queries_test_basic import (
    GetTestBasicByIdQuery,
    GetTestBasicByCodeQuery,
    SearchTestBasicsQuery,
)



def register_test_basic_container(container: Container) -> None:
    """
    Register all TestBasic-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register TestBasic repository
    test_basic_repository = SQLTestBasicRepository()
    container.register(TestBasicRepository, instance=test_basic_repository)
    
    # Register TestBasic command handler
    test_basic_command_handler = TestBasicCommandHandler(
        test_basic_repository=test_basic_repository
    )
    container.register(TestBasicCommandHandler, instance=test_basic_command_handler)
    
    # Register TestBasic query handler
    test_basic_query_handler = TestBasicQueryHandler(
        test_basic_repository=test_basic_repository
    )
    container.register(TestBasicQueryHandler, instance=test_basic_query_handler)


def register_test_basic_mediator(mediator: Mediator) -> None:
    """
    Register all TestBasic command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register TestBasic command handlers
    mediator.register_command_handler(CreateTestBasicCommand, TestBasicCommandHandler)
    mediator.register_command_handler(UpdateTestBasicCommand, TestBasicCommandHandler)
    mediator.register_command_handler(DeleteTestBasicCommand, TestBasicCommandHandler)
    
    # Register TestBasic query handlers
    mediator.register_query_handler(GetTestBasicByIdQuery, TestBasicQueryHandler)
    mediator.register_query_handler(GetTestBasicByCodeQuery, TestBasicQueryHandler)
    mediator.register_query_handler(SearchTestBasicsQuery, TestBasicQueryHandler)
