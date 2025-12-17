"""
User domain entity
"""
from datetime import datetime, timezone
from typing import Optional
from dataclasses import dataclass, field
from app.domain.shared.value_objects.email import Email
from app.domain.shared.value_objects.first_name import FirstName
from app.domain.shared.value_objects.last_name import LastName
from app.shared.utils import generate_id


@dataclass
class User:
    """User domain entity"""
    # Required fields (no defaults)
    username: str
    first_name: FirstName
    last_name: LastName
    email: Email
    tenant_id: str  # Multi-tenancy support
    # Optional fields (with defaults)
    id: str = field(default_factory=generate_id)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = field(default=True)
    base_role: Optional[str] = field(default=None)
    last_login: Optional[datetime] = field(default=None)
    locked_until: Optional[datetime] = field(default=None)
    
    def update_username(self, new_username: str) -> None:
        """Update user username"""
        self.username = new_username
        self.updated_at = datetime.now(timezone.utc)
    
    def update_first_name(self, new_first_name: FirstName) -> None:
        """Update user first name"""
        self.first_name = new_first_name
        self.updated_at = datetime.now(timezone.utc)
    
    def update_last_name(self, new_last_name: LastName) -> None:
        """Update user last name"""
        self.last_name = new_last_name
        self.updated_at = datetime.now(timezone.utc)
    
    def update_names(self, new_first_name: FirstName, new_last_name: LastName) -> None:
        """Update both first and last name"""
        self.first_name = new_first_name
        self.last_name = new_last_name
        self.updated_at = datetime.now(timezone.utc)
    
    def get_full_name(self) -> str:
        """Get full name as a string"""
        return f"{self.first_name.value} {self.last_name.value}"
    
    def update_email(self, new_email: Email) -> None:
        """Update user email"""
        self.email = new_email
        self.updated_at = datetime.now(timezone.utc)
    
    def deactivate(self) -> None:
        """Deactivate user"""
        self.is_active = False
        self.updated_at = datetime.now(timezone.utc)
    
    def activate(self) -> None:
        """Activate user"""
        self.is_active = True
        self.updated_at = datetime.now(timezone.utc)
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, User):
            return False
        return self.id == other.id
    
    def __hash__(self) -> int:
        return hash(self.id)

