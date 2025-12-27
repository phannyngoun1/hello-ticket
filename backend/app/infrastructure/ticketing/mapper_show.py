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
        # Handle optional columns gracefully in case they don't exist in database yet
        started_date = getattr(model, 'started_date', None)
        ended_date = getattr(model, 'ended_date', None)
        note = getattr(model, 'note', None)
        
        return Show(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            show_id=model.id,
            organizer_id=model.organizer_id,
            is_active=model.is_active,
            started_date=started_date,
            ended_date=ended_date,
            note=note,
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
        # Only include optional fields if they exist (for compatibility with older schemas)
        model_data = {
            'id': show.id,
            'tenant_id': show.tenant_id,
            'code': show.code,
            'name': show.name,
            'organizer_id': show.organizer_id,
            'is_active': show.is_active,
            'version': show.get_version(),
            'created_at': show.created_at,
            'updated_at': show.updated_at,
        }
        
        # Only add optional fields if they're provided
        if hasattr(show, 'started_date') and show.started_date is not None:
            model_data['started_date'] = show.started_date
        if hasattr(show, 'ended_date') and show.ended_date is not None:
            model_data['ended_date'] = show.ended_date
        if hasattr(show, 'note') and show.note is not None:
            model_data['note'] = show.note
            
        return ShowModel(**model_data)

