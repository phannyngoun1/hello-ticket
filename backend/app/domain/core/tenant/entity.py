"""
Tenant domain entity
"""
from datetime import datetime, timezone
from typing import Optional
from dataclasses import dataclass, field
from app.domain.shared.value_objects.name import Name
from app.shared.utils import generate_id


@dataclass
class Tenant:
    """Tenant domain entity for multi-tenancy support"""
    # Required fields
    name: Name
    # Optional fields with defaults
    id: str = field(default_factory=generate_id)
    slug: Optional[str] = None  # URL-friendly identifier
    is_active: bool = field(default=True)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    # Configuration
    settings: dict = field(default_factory=dict)
    # Database strategy configuration
    database_strategy: str = field(default="shared_database")  # "shared_database" or "dedicated_database"
    database_config: dict = field(default_factory=dict)  # Connection details for dedicated DB
    
    def update_name(self, new_name: Name) -> None:
        """Update tenant name"""
        self.name = new_name
        self.updated_at = datetime.now(timezone.utc)
    
    def update_slug(self, new_slug: str) -> None:
        """Update tenant slug"""
        self.slug = new_slug.strip().lower()
        self.updated_at = datetime.now(timezone.utc)
    
    def update_settings(self, settings: dict) -> None:
        """Update tenant settings"""
        self.settings = settings
        self.updated_at = datetime.now(timezone.utc)
    
    def deactivate(self) -> None:
        """Deactivate tenant"""
        self.is_active = False
        self.updated_at = datetime.now(timezone.utc)
    
    def activate(self) -> None:
        """Activate tenant"""
        self.is_active = True
        self.updated_at = datetime.now(timezone.utc)
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Tenant):
            return False
        return self.id == other.id
    
    def __hash__(self) -> int:
        return hash(self.id)

