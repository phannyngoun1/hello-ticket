"""
Container and mediator registration for Code Generator service.

This module handles all dependency injection and mediator registrations
for the Code Generator shared service.
"""
from punq import Container
from app.domain.shared.repositories import SequenceRepository
from app.infrastructure.shared.sequence_repository import SQLSequenceRepository
from app.shared.services.code_generator import CodeGeneratorService


def register_code_generator_container(container: Container) -> None:
    """
    Register all Code Generator-related dependencies in the container.
    
    This includes:
    - Sequence repository
    - Code generator service
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register Sequence repository
    container.register(SequenceRepository, instance=SQLSequenceRepository())
    
    # Register code generator service
    sequence_repository = container.resolve(SequenceRepository)
    code_generator = CodeGeneratorService(sequence_repository=sequence_repository)
    container.register(CodeGeneratorService, instance=code_generator)
