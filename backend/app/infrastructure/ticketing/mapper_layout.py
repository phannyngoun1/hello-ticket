"""
Mapper between Layout domain entity and LayoutModel database model
"""
from typing import Optional
from app.domain.ticketing.layout import Layout
from app.infrastructure.shared.database.models import LayoutModel
from app.infrastructure.shared.mapper import BaseMapper


class LayoutMapper(BaseMapper[Layout, LayoutModel]):
    """Maps between Layout domain entity and LayoutModel"""
    
    def to_domain(self, model: LayoutModel) -> Optional[Layout]:
        """Convert LayoutModel to Layout domain entity"""
        if not model:
            return None
        
        return Layout(
            tenant_id=model.tenant_id,
            venue_id=model.venue_id,
            name=model.name,
            layout_id=model.id,
            description=model.description,
            file_id=model.file_id,
            design_mode=model.design_mode if hasattr(model, 'design_mode') else "seat-level",
            canvas_background_color=getattr(model, 'canvas_background_color', None) or "#e5e7eb",
            marker_fill_transparency=getattr(model, 'marker_fill_transparency', 1.0),
            is_active=model.is_active,
            attributes=model.attributes if hasattr(model, 'attributes') else {},
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    def to_model(self, layout: Layout) -> Optional[LayoutModel]:
        """Convert Layout domain entity to LayoutModel"""
        if not layout:
            return None
            
        return LayoutModel(
            id=layout.id,
            tenant_id=layout.tenant_id,
            venue_id=layout.venue_id,
            name=layout.name,
            description=layout.description,
            file_id=layout.file_id,
            design_mode=layout.design_mode,
            canvas_background_color=layout.canvas_background_color or "#e5e7eb",
            marker_fill_transparency=layout.marker_fill_transparency,
            is_active=layout.is_active,
            version=layout.get_version(),
            created_at=layout.created_at,
            updated_at=layout.updated_at,
        )
