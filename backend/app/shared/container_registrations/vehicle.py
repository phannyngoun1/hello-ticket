"""
Container and mediator registration for Vehicle module.

This module handles all dependency injection and mediator registrations
for the Vehicle domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.warehouse.vehicle_repositories import VehicleRepository
from app.application.warehouse.handlers_vehicle import VehicleCommandHandler, VehicleQueryHandler
from app.infrastructure.warehouse.vehicle_repository import SQLVehicleRepository
from app.application.warehouse.commands_vehicle import (
    CreateVehicleCommand,
    UpdateVehicleCommand,
    DeleteVehicleCommand,
)
from app.application.warehouse.queries_vehicle import (
    GetVehicleByIdQuery,
    GetVehicleByCodeQuery,
    SearchVehiclesQuery,
)



def register_vehicle_container(container: Container) -> None:
    """
    Register all Vehicle-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register Vehicle repository
    vehicle_repository = SQLVehicleRepository()
    container.register(VehicleRepository, instance=vehicle_repository)
    
    # Register Vehicle command handler
    vehicle_command_handler = VehicleCommandHandler(
        vehicle_repository=vehicle_repository
    )
    container.register(VehicleCommandHandler, instance=vehicle_command_handler)
    
    # Register Vehicle query handler
    vehicle_query_handler = VehicleQueryHandler(
        vehicle_repository=vehicle_repository
    )
    container.register(VehicleQueryHandler, instance=vehicle_query_handler)


def register_vehicle_mediator(mediator: Mediator) -> None:
    """
    Register all Vehicle command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register Vehicle command handlers
    mediator.register_command_handler(CreateVehicleCommand, VehicleCommandHandler)
    mediator.register_command_handler(UpdateVehicleCommand, VehicleCommandHandler)
    mediator.register_command_handler(DeleteVehicleCommand, VehicleCommandHandler)
    
    # Register Vehicle query handlers
    mediator.register_query_handler(GetVehicleByIdQuery, VehicleQueryHandler)
    mediator.register_query_handler(GetVehicleByCodeQuery, VehicleQueryHandler)
    mediator.register_query_handler(SearchVehiclesQuery, VehicleQueryHandler)
