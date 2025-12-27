from fastapi import APIRouter
from .event_routes import router as event_router
from .event_seat_routes import router as event_seat_router
from .show_routes import router as show_router
from .event_type_routes import router as event_type_router
from .organizer_routes import router as organizer_router
from .venue_routes import router as venue_router
from .layout_routes import router as layout_router
from .seat_routes import router as seat_router
from .section_routes import router as section_router

# Main router that combines all ticketing routes
router = APIRouter()
router.include_router(venue_router)
router.include_router(layout_router)
router.include_router(seat_router)
router.include_router(section_router)
router.include_router(organizer_router)
router.include_router(event_type_router)
router.include_router(show_router)
router.include_router(event_router)
router.include_router(event_seat_router)

# Export as ticketing_router for consistency
ticketing_router = router

__all__ = ["ticketing_router"]
