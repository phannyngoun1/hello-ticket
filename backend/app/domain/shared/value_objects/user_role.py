"""
UserRole value object for user-role assignments
"""
from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class UserRole:
    """
    UserRole value object representing a user-role assignment
    
    This is used for direct user-to-role assignments (Method 1)
    """
    user_id: str
    role_id: str
    tenant_id: str
    assigned_at: datetime
    
    def __post_init__(self):
        """Validate fields"""
        if not self.user_id or not isinstance(self.user_id, str):
            raise ValueError("user_id must be a non-empty string")
        
        if not self.role_id or not isinstance(self.role_id, str):
            raise ValueError("role_id must be a non-empty string")
        
        if not self.tenant_id or not isinstance(self.tenant_id, str):
            raise ValueError("tenant_id must be a non-empty string")
        
        if not isinstance(self.assigned_at, datetime):
            raise ValueError("assigned_at must be a datetime")

