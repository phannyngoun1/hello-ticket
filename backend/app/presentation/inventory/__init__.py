"""
Inventory Presentation Layer

Routes for inventory management.
"""
from fastapi import APIRouter

from .item_routes import router as item_router
from .inventory_operations_routes import router as inventory_operations_router
from .inventory_queries_routes import router as inventory_queries_router
from .unit_of_measure_routes import router as unit_of_measure_router
from .category_routes import router as category_router

# Main router that combines all inventory routes
router = APIRouter()
router.include_router(item_router)
router.include_router(inventory_operations_router)
router.include_router(inventory_queries_router)
router.include_router(unit_of_measure_router)
router.include_router(category_router)

# Export as inventory_router for consistency
inventory_router = router

__all__ = ["inventory_router"]
