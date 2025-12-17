"""
User Preferences Entity - Domain layer
"""
from datetime import datetime
from typing import Dict, Any, Optional


class UserPreferences:
    """User preferences entity"""
    
    def __init__(
        self,
        id: str,
        user_id: str,
        tenant_id: str,
        preferences: Dict[str, Any],
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        self.id = id
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.preferences = preferences or {}
        self.created_at = created_at
        self.updated_at = updated_at
    
    def get_preference(self, *path: str) -> Any:
        """Get preference value by path (e.g., 'ui', 'dataListView', 'roles')"""
        current = self.preferences
        for key in path:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return None
        return current
    
    def set_preference(self, *path: str, value: Any) -> None:
        """Set preference value by path"""
        if not path:
            return
        
        current = self.preferences
        for key in path[:-1]:
            if key not in current:
                current[key] = {}
            elif not isinstance(current[key], dict):
                current[key] = {}
            current = current[key]
        
        current[path[-1]] = value
    
    def remove_preference(self, *path: str) -> None:
        """Remove preference by path"""
        if not path:
            return
        
        current = self.preferences
        for key in path[:-1]:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return
        
        if isinstance(current, dict) and path[-1] in current:
            del current[path[-1]]
    
    def update_preferences(self, updates: Dict[str, Any]) -> None:
        """Merge updates into existing preferences"""
        self._deep_merge(self.preferences, updates)
    
    def _deep_merge(self, target: Dict[str, Any], source: Dict[str, Any]) -> None:
        """Deep merge source into target"""
        for key, value in source.items():
            if key in target and isinstance(target[key], dict) and isinstance(value, dict):
                self._deep_merge(target[key], value)
            else:
                target[key] = value

