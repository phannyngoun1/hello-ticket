"""
Container and mediator registration for {{EntityName}} module.

This module handles all dependency injection and mediator registrations
for the {{EntityName}} domain entity (tree structure).
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.{{moduleName}}.{{EntityNameLower}}_repositories import {{EntityName}}Repository
from app.application.{{moduleName}}.handlers_{{EntityNameLower}} import {{EntityName}}CommandHandler, {{EntityName}}QueryHandler
from app.infrastructure.{{moduleName}}.{{EntityNameLower}}_repository import SQL{{EntityName}}Repository
from app.application.{{moduleName}}.commands_{{EntityNameLower}} import (
    Create{{EntityName}}Command,
    Update{{EntityName}}Command,
    Delete{{EntityName}}Command,
)
from app.application.{{moduleName}}.queries_{{EntityNameLower}} import (
    Get{{EntityName}}ByIdQuery,
    Get{{EntityName}}ByCodeQuery,
    Search{{EntityNamePlural}}Query,
    Get{{EntityName}}TreeQuery,
    Get{{EntityName}}ChildrenQuery,
)
{{CodeGeneratorContainerImport}}


def register_{{EntityNameLower}}_container(container: Container) -> None:
    """
    Register all {{EntityName}}-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register {{EntityName}} repository
    {{EntityNameLower}}_repository = SQL{{EntityName}}Repository()
    container.register({{EntityName}}Repository, instance={{EntityNameLower}}_repository)
    
{{CodeGeneratorContainerSetup}}    # Register {{EntityName}} command handler
    {{EntityNameLower}}_command_handler = {{EntityName}}CommandHandler(
        {{EntityNameLower}}_repository={{EntityNameLower}}_repository{{CodeGeneratorConstructorArg}}
    )
    container.register({{EntityName}}CommandHandler, instance={{EntityNameLower}}_command_handler)
    
    # Register {{EntityName}} query handler
    {{EntityNameLower}}_query_handler = {{EntityName}}QueryHandler(
        {{EntityNameLower}}_repository={{EntityNameLower}}_repository
    )
    container.register({{EntityName}}QueryHandler, instance={{EntityNameLower}}_query_handler)


def register_{{EntityNameLower}}_mediator(mediator: Mediator) -> None:
    """
    Register all {{EntityName}} command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register {{EntityName}} command handlers
    mediator.register_command_handler(Create{{EntityName}}Command, {{EntityName}}CommandHandler)
    mediator.register_command_handler(Update{{EntityName}}Command, {{EntityName}}CommandHandler)
    mediator.register_command_handler(Delete{{EntityName}}Command, {{EntityName}}CommandHandler)
    
    # Register {{EntityName}} query handlers
    mediator.register_query_handler(Get{{EntityName}}ByIdQuery, {{EntityName}}QueryHandler)
    mediator.register_query_handler(Get{{EntityName}}ByCodeQuery, {{EntityName}}QueryHandler)
    mediator.register_query_handler(Search{{EntityNamePlural}}Query, {{EntityName}}QueryHandler)
    mediator.register_query_handler(Get{{EntityName}}TreeQuery, {{EntityName}}QueryHandler)
    mediator.register_query_handler(Get{{EntityName}}ChildrenQuery, {{EntityName}}QueryHandler)
