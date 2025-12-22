"""API mapper for Ticketing module"""
from app.domain.ticketing.show import Show
from app.presentation.api.ticketing.schemas_show import ShowResponse, ShowImage


class TicketingApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def show_to_response(show: Show) -> ShowResponse:
        # Convert images from domain format (list of dicts) to ShowImage models
        images = []
        if show.images:
            images = [ShowImage(url=img["url"], type=img["type"]) for img in show.images]
        
        return ShowResponse(
            id=show.id,
            tenant_id=show.tenant_id,
            code=show.code,
            name=show.name,
            organizer_id=show.organizer_id,
            is_active=show.is_active,
            started_date=show.started_date,
            ended_date=show.ended_date,
            images=images,
            note=show.note,
            created_at=show.created_at,
            updated_at=show.updated_at,
            deactivated_at=show.deactivated_at,
        )

