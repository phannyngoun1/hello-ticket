"""
Organizer mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.ticketing.organizer import Organizer
from app.infrastructure.shared.database.models import OrganizerModel


class OrganizerMapper:
    """Mapper for Organizer entity to OrganizerModel conversion"""
    
    @staticmethod
    def to_domain(model: OrganizerModel) -> Organizer:
        """Convert database model to domain entity
        
        Args:
            model: OrganizerModel from database
            
        Returns:
            Organizer domain entity
        """
        return Organizer(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            description=model.description,
            email=model.email,
            phone=model.phone,
            website=model.website,
            address=model.address,
            city=model.city,
            country=model.country,
            logo=model.logo,
            organizer_id=model.id,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    @staticmethod
    def to_model(organizer: Organizer) -> OrganizerModel:
        """Convert domain entity to database model
        
        Args:
            organizer: Organizer domain entity
            
        Returns:
            OrganizerModel for database persistence
        """
        return OrganizerModel(
            id=organizer.id,
            tenant_id=organizer.tenant_id,
            code=organizer.code,
            name=organizer.name,
            description=organizer.description,
            email=organizer.email,
            phone=organizer.phone,
            website=organizer.website,
            address=organizer.address,
            city=organizer.city,
            country=organizer.country,
            logo=organizer.logo,
            is_active=organizer.is_active,
            version=organizer.get_version(),
            created_at=organizer.created_at,
            updated_at=organizer.updated_at,
        )

