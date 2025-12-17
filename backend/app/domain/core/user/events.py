"""
User domain events
"""
from typing import Dict, Any
from app.domain.shared.events.base import DomainEvent


class UserCreated(DomainEvent):
    """Event raised when a user is created"""
    
    def __init__(self, user_id: str, name: str, email: str, **kwargs):
        super().__init__(**kwargs)
        self.user_id = user_id
        self.name = name
        self.email = email
    
    def event_type(self) -> str:
        return "user.created"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type(),
            "occurred_at": self.occurred_at.isoformat(),
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "metadata": self.metadata
        }


class UserUpdated(DomainEvent):
    """Event raised when a user is updated"""
    
    def __init__(self, user_id: str, changes: Dict[str, Any], **kwargs):
        super().__init__(**kwargs)
        self.user_id = user_id
        self.changes = changes
    
    def event_type(self) -> str:
        return "user.updated"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type(),
            "occurred_at": self.occurred_at.isoformat(),
            "user_id": self.user_id,
            "changes": self.changes,
            "metadata": self.metadata
        }


class UserDeactivated(DomainEvent):
    """Event raised when a user is deactivated"""
    
    def __init__(self, user_id: str, **kwargs):
        super().__init__(**kwargs)
        self.user_id = user_id
    
    def event_type(self) -> str:
        return "user.deactivated"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type(),
            "occurred_at": self.occurred_at.isoformat(),
            "user_id": self.user_id,
            "metadata": self.metadata
        }

