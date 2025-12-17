"""
Inventory Application Layer

Exports all commands, queries, and handlers for the inventory module.
"""

# Import commands
from .commands import (
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
)

# Import queries
from .queries import (
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

# Import handlers
from .handlers import (
    InventoryCommandHandler,
    InventoryQueryHandler,
)

__all__ = [
    # Commands
    "CreateItemCommand",
    "UpdateItemCommand",
    "DeleteItemCommand",
    "ReceiveInventoryCommand",
    "IssueInventoryCommand",
    "AdjustInventoryCommand",
    "MoveInventoryCommand",
    "ReserveInventoryCommand",
    "ReleaseReservationCommand",
    "CreateUnitOfMeasureCommand",
    "UpdateUnitOfMeasureCommand",
    "DeleteUnitOfMeasureCommand",
    "CreateCategoryCommand",
    "UpdateCategoryCommand",
    "DeleteCategoryCommand",
    # Queries
    "GetItemByIdQuery",
    "GetItemBySkuQuery",
    "GetItemsByIdsQuery",
    "GetAllItemsQuery",
    "SearchItemsQuery",
    "GetInventoryBalanceQuery",
    "GetAvailableQuantityQuery",
    "GetBalancesByItemQuery",
    "GetTransactionHistoryQuery",
    "GetTransactionsByReferenceQuery",
    "GetTransactionsByDateRangeQuery",
    "GetUnitOfMeasureByIdQuery",
    "GetUnitOfMeasureByCodeQuery",
    "GetAllUnitsOfMeasureQuery",
    "SearchUnitsOfMeasureQuery",
    "GetCategoryByIdQuery",
    "GetCategoryByCodeQuery",
    "GetAllCategoriesQuery",
    "GetCategoryTreeQuery",
    "GetCategoryHierarchyQuery",
    "GetCategoryChildrenQuery",
    # Handlers
    "InventoryCommandHandler",
    "InventoryQueryHandler",
]

