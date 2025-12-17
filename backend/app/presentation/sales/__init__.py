from fastapi import APIRouter
from .test_basic_routes import router as test_basic_router
from .test_routes import router as test_router
from .test_basic_routes import router as test_basic_router

from .test_tree_routes import router as test_tree_router
from .customer_group_routes import router as customer_group_router
from .customer_type_routes import router as customer_type_router
from .routes import router as sales_router

# Main router that combines all sales routes
router = APIRouter()
router.include_router(sales_router)
router.include_router(customer_type_router)
router.include_router(test_tree_router)
router.include_router(customer_group_router)
router.include_router(test_router)
router.include_router(test_basic_router)

# Export as sales_router for consistency
sales_router = router

__all__ = ["sales_router"]
