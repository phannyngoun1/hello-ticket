"""
Container and mediator registration for Test module.

This module handles all dependency injection and mediator registrations
for the Test domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.sales.test_repositories import TestRepository
from app.application.sales.handlers_test import TestCommandHandler, TestQueryHandler
from app.infrastructure.sales.test_repository import SQLTestRepository
from app.application.sales.commands_test import (
    CreateTestCommand,
    UpdateTestCommand,
    DeleteTestCommand,

)
from app.application.sales.queries_test import (
    GetTestByIdQuery,
    GetTestByCodeQuery,
    SearchTestsQuery,
)

from app.shared.services.code_generator import CodeGeneratorService


def register_test_container(container: Container) -> None:
    """
    Register all Test-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register Test repository
    test_repository = SQLTestRepository()
    container.register(TestRepository, instance=test_repository)
    
    code_generator = container.resolve(CodeGeneratorService)
    # Register Test command handler
    test_command_handler = TestCommandHandler(
        test_repository=test_repository,
        code_generator=code_generator
    )
    container.register(TestCommandHandler, instance=test_command_handler)
    
    # Register Test query handler
    test_query_handler = TestQueryHandler(
        test_repository=test_repository
    )
    container.register(TestQueryHandler, instance=test_query_handler)


def register_test_mediator(mediator: Mediator) -> None:
    """
    Register all Test command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register Test command handlers
    mediator.register_command_handler(CreateTestCommand, TestCommandHandler)
    mediator.register_command_handler(UpdateTestCommand, TestCommandHandler)
    mediator.register_command_handler(DeleteTestCommand, TestCommandHandler)

    
    # Register Test query handlers
    mediator.register_query_handler(GetTestByIdQuery, TestQueryHandler)
    mediator.register_query_handler(GetTestByCodeQuery, TestQueryHandler)
    mediator.register_query_handler(SearchTestsQuery, TestQueryHandler)
