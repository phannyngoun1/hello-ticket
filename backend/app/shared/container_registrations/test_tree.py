"""
Container and mediator registration for TestTree module.

This module handles all dependency injection and mediator registrations
for the TestTree domain entity (tree structure).
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.sales.test_tree_repositories import TestTreeRepository
from app.application.sales.handlers_test_tree import TestTreeCommandHandler, TestTreeQueryHandler
from app.infrastructure.sales.test_tree_repository import SQLTestTreeRepository
from app.application.sales.commands_test_tree import (
    CreateTestTreeCommand,
    UpdateTestTreeCommand,
    DeleteTestTreeCommand,
)
from app.application.sales.queries_test_tree import (
    GetTestTreeByIdQuery,
    GetTestTreeByCodeQuery,
    SearchTestTreesQuery,
    GetTestTreeTreeQuery,
    GetTestTreeChildrenQuery,
)



def register_test_tree_container(container: Container) -> None:
    """
    Register all TestTree-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register TestTree repository
    test_tree_repository = SQLTestTreeRepository()
    container.register(TestTreeRepository, instance=test_tree_repository)
    
    # Register TestTree command handler
    test_tree_command_handler = TestTreeCommandHandler(
        test_tree_repository=test_tree_repository
    )
    container.register(TestTreeCommandHandler, instance=test_tree_command_handler)
    
    # Register TestTree query handler
    test_tree_query_handler = TestTreeQueryHandler(
        test_tree_repository=test_tree_repository
    )
    container.register(TestTreeQueryHandler, instance=test_tree_query_handler)


def register_test_tree_mediator(mediator: Mediator) -> None:
    """
    Register all TestTree command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register TestTree command handlers
    mediator.register_command_handler(CreateTestTreeCommand, TestTreeCommandHandler)
    mediator.register_command_handler(UpdateTestTreeCommand, TestTreeCommandHandler)
    mediator.register_command_handler(DeleteTestTreeCommand, TestTreeCommandHandler)
    
    # Register TestTree query handlers
    mediator.register_query_handler(GetTestTreeByIdQuery, TestTreeQueryHandler)
    mediator.register_query_handler(GetTestTreeByCodeQuery, TestTreeQueryHandler)
    mediator.register_query_handler(SearchTestTreesQuery, TestTreeQueryHandler)
    mediator.register_query_handler(GetTestTreeTreeQuery, TestTreeQueryHandler)
    mediator.register_query_handler(GetTestTreeChildrenQuery, TestTreeQueryHandler)
