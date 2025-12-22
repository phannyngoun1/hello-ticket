"""
Show mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.ticketing.show import Show
from app.infrastructure.shared.database.models import ShowModel


class ShowMapper:
    """Mapper for Show entity to ShowModel conversion"""
    
    @staticmethod
    def to_domain(model: ShowModel) -> Show:
        """Convert database model to domain entity
        
        Args:
            model: ShowModel from database
            
        Returns:
            Show domain entity
        """
        # Convert images from JSONB (dict/list) to list format
        images = None
        if model.images is not None:
            if isinstance(model.images, list):
                images = model.images
            elif isinstance(model.images, dict):
                # If stored as dict, convert to list
                images = list(model.images.values()) if model.images else []
            else:
                images = []
        
        return Show(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            show_id=model.id,
            organizer_id=model.organizer_id,
            is_active=model.is_active,
            started_date=model.started_date,
            ended_date=model.ended_date,
            images=images,
            note=model.note,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    @staticmethod
    def to_model(show: Show) -> ShowModel:
        """Convert domain entity to database model
        
        Args:
            show: Show domain entity
            
        Returns:
            ShowModel for database persistence
        """
        return ShowModel(
            id=show.id,
            tenant_id=show.tenant_id,
            code=show.code,
            name=show.name,
            organizer_id=show.organizer_id,
            is_active=show.is_active,
            started_date=show.started_date,
            ended_date=show.ended_date,
            images=show.images if show.images else None,
            note=show.note,
            version=show.get_version(),
            created_at=show.created_at,
            updated_at=show.updated_at,
        )

