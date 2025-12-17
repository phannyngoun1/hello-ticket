"""
Container and mediator registration for Inventory module.

This module handles all dependency injection and mediator registrations
for the Inventory domain entities.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.inventory.repositories import (
    ItemRepository,
    InventoryBalanceRepository,
    SerialRepository,
    InventoryTrackingRepository,
    InventoryTransactionRepository,
    UnitOfMeasureRepository,
    ItemCategoryRepository,
)
from app.infrastructure.inventory.item_repository import SQLItemRepository
from app.infrastructure.inventory.balance_repository import SQLInventoryBalanceRepository
from app.infrastructure.inventory.serial_repository import SQLSerialRepository
from app.infrastructure.inventory.tracking_repository import SQLInventoryTrackingRepository
from app.infrastructure.inventory.transaction_repository import SQLInventoryTransactionRepository
from app.infrastructure.inventory.uom_repository import SQLUnitOfMeasureRepository
from app.infrastructure.inventory.category_repository import SQLItemCategoryRepository
from app.application.inventory import (
    InventoryCommandHandler,
    InventoryQueryHandler,
    CreateItemCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    ReceiveInventoryCommand,
    IssueInventoryCommand,
    AdjustInventoryCommand,
    MoveInventoryCommand,
    ReserveInventoryCommand,
    ReleaseReservationCommand,
    CreateUnitOfMeasureCommand,
    UpdateUnitOfMeasureCommand,
    DeleteUnitOfMeasureCommand,
    CreateCategoryCommand,
    UpdateCategoryCommand,
    DeleteCategoryCommand,
    GetItemByIdQuery,
    GetItemBySkuQuery,
    GetItemsByIdsQuery,
    GetAllItemsQuery,
    SearchItemsQuery,
    GetInventoryBalanceQuery,
    GetAvailableQuantityQuery,
    GetBalancesByItemQuery,
    GetTransactionHistoryQuery,
    GetTransactionsByReferenceQuery,
    GetTransactionsByDateRangeQuery,
    GetUnitOfMeasureByIdQuery,
    GetUnitOfMeasureByCodeQuery,
    GetAllUnitsOfMeasureQuery,
    SearchUnitsOfMeasureQuery,
    GetCategoryByIdQuery,
    GetCategoryByCodeQuery,
    GetAllCategoriesQuery,
    GetCategoryTreeQuery,
    GetCategoryHierarchyQuery,
    GetCategoryChildrenQuery,
)


def register_inventory_container(container: Container) -> None:
    """
    Register all Inventory-related dependencies in the container.
    
    This includes:
    - Repositories (domain -> infrastructure)
    - Command handlers
    - Query handlers
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register Inventory repositories
    container.register(ItemRepository, instance=SQLItemRepository())
    container.register(InventoryBalanceRepository, instance=SQLInventoryBalanceRepository())
    container.register(SerialRepository, instance=SQLSerialRepository())
    container.register(InventoryTrackingRepository, instance=SQLInventoryTrackingRepository())
    container.register(InventoryTransactionRepository, instance=SQLInventoryTransactionRepository())
    container.register(UnitOfMeasureRepository, instance=SQLUnitOfMeasureRepository())
    container.register(ItemCategoryRepository, instance=SQLItemCategoryRepository())
    
    # Register Inventory command handler
    inventory_command_handler = InventoryCommandHandler(
        item_repository=container.resolve(ItemRepository),
        balance_repository=container.resolve(InventoryBalanceRepository),
        serial_repository=container.resolve(SerialRepository),
        tracking_repository=container.resolve(InventoryTrackingRepository),
        transaction_repository=container.resolve(InventoryTransactionRepository),
        uom_repository=container.resolve(UnitOfMeasureRepository),
        category_repository=container.resolve(ItemCategoryRepository),
    )
    container.register(InventoryCommandHandler, instance=inventory_command_handler)
    
    # Register Inventory query handler
    inventory_query_handler = InventoryQueryHandler(
        item_repository=container.resolve(ItemRepository),
        balance_repository=container.resolve(InventoryBalanceRepository),
        transaction_repository=container.resolve(InventoryTransactionRepository),
        uom_repository=container.resolve(UnitOfMeasureRepository),
        category_repository=container.resolve(ItemCategoryRepository),
    )
    container.register(InventoryQueryHandler, instance=inventory_query_handler)


def register_inventory_mediator(mediator: Mediator) -> None:
    """
    Register all Inventory command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register Inventory command handlers
    mediator.register_command_handler(CreateItemCommand, InventoryCommandHandler)
    mediator.register_command_handler(UpdateItemCommand, InventoryCommandHandler)
    mediator.register_command_handler(DeleteItemCommand, InventoryCommandHandler)
    mediator.register_command_handler(ReceiveInventoryCommand, InventoryCommandHandler)
    mediator.register_command_handler(IssueInventoryCommand, InventoryCommandHandler)
    mediator.register_command_handler(AdjustInventoryCommand, InventoryCommandHandler)
    mediator.register_command_handler(MoveInventoryCommand, InventoryCommandHandler)
    mediator.register_command_handler(ReserveInventoryCommand, InventoryCommandHandler)
    mediator.register_command_handler(ReleaseReservationCommand, InventoryCommandHandler)
    mediator.register_command_handler(CreateUnitOfMeasureCommand, InventoryCommandHandler)
    mediator.register_command_handler(UpdateUnitOfMeasureCommand, InventoryCommandHandler)
    mediator.register_command_handler(DeleteUnitOfMeasureCommand, InventoryCommandHandler)
    mediator.register_command_handler(CreateCategoryCommand, InventoryCommandHandler)
    mediator.register_command_handler(UpdateCategoryCommand, InventoryCommandHandler)
    mediator.register_command_handler(DeleteCategoryCommand, InventoryCommandHandler)
    
    # Register Inventory query handlers
    mediator.register_query_handler(GetItemByIdQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetItemBySkuQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetItemsByIdsQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetAllItemsQuery, InventoryQueryHandler)
    mediator.register_query_handler(SearchItemsQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetInventoryBalanceQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetAvailableQuantityQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetBalancesByItemQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetTransactionHistoryQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetTransactionsByReferenceQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetTransactionsByDateRangeQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetUnitOfMeasureByIdQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetUnitOfMeasureByCodeQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetAllUnitsOfMeasureQuery, InventoryQueryHandler)
    mediator.register_query_handler(SearchUnitsOfMeasureQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetCategoryByIdQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetCategoryByCodeQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetAllCategoriesQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetCategoryTreeQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetCategoryHierarchyQuery, InventoryQueryHandler)
    mediator.register_query_handler(GetCategoryChildrenQuery, InventoryQueryHandler)
