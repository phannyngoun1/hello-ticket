from fastapi import APIRouter
from .employee_routes import router as employee_router
from .booking_routes import router as booking_router
from .payment_routes import router as payment_router
from .customer_group_routes import router as customer_group_router
from .customer_type_routes import router as customer_type_router
from .id_type_routes import router as id_type_router
from .routes import router as sales_router

# Main router that combines all sales routes
router = APIRouter()
router.include_router(sales_router)
router.include_router(customer_type_router)
router.include_router(id_type_router)
router.include_router(customer_group_router)
router.include_router(booking_router)
router.include_router(payment_router)
router.include_router(employee_router)

# Export as sales_router for consistency
sales_router = router

__all__ = ["sales_router"]
