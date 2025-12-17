"""
API Key handling for external system integration
"""
import secrets
import hashlib
from typing import Optional, Dict, List
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, field


@dataclass
class APIKey:
    """API Key model"""
    key_id: str
    key_hash: str
    name: str
    description: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool = True
    permissions: List[str] = field(default_factory=list)
    metadata: Dict[str, str] = field(default_factory=dict)
    last_used_at: Optional[datetime] = None
    
    def is_valid(self) -> bool:
        """Check if API key is valid"""
        if not self.is_active:
            return False
        if self.expires_at and datetime.now(timezone.utc) > self.expires_at:
            return False
        return True


class APIKeyHandler:
    """API Key management and validation"""
    
    def __init__(self):
        # In production, store in database
        # For demo purposes, using in-memory storage
        self._api_keys: Dict[str, APIKey] = {}
        self._initialize_demo_keys()
    
    def _initialize_demo_keys(self):
        """Initialize some demo API keys for testing"""
        # Create a demo API key
        demo_key = "sk_test_4eC39HqLyjWDarjtT1zdp7dc"
        demo_key_hash = self._hash_key(demo_key)
        
        self._api_keys["demo_key_1"] = APIKey(
            key_id="demo_key_1",
            key_hash=demo_key_hash,
            name="Demo External System",
            description="Demo API key for testing external system integration",
            created_at=datetime.now(timezone.utc),
            expires_at=None,
            is_active=True,
            permissions=["products:read", "products:write", "orders:read", "orders:write"],
            metadata={"system": "demo", "environment": "development"}
        )
    
    def _hash_key(self, key: str) -> str:
        """Hash API key using SHA-256"""
        return hashlib.sha256(key.encode()).hexdigest()
    
    def generate_api_key(
        self,
        name: str,
        description: str = "",
        expires_in_days: Optional[int] = None,
        permissions: Optional[List[str]] = None
    ) -> tuple[str, APIKey]:
        """Generate a new API key
        
        Args:
            name: Name/identifier for the API key
            description: Description of what this key is for
            expires_in_days: Number of days until expiration (None = never expires)
            permissions: List of permissions granted to this key
            
        Returns:
            Tuple of (plain_text_key, api_key_object)
            Note: plain_text_key is only returned once and cannot be retrieved again
        """
        # Generate secure random key
        key_id = f"key_{secrets.token_urlsafe(16)}"
        plain_key = f"sk_{secrets.token_urlsafe(32)}"
        key_hash = self._hash_key(plain_key)
        
        # Calculate expiration
        expires_at = None
        if expires_in_days:
            expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)
        
        # Create API key object
        api_key = APIKey(
            key_id=key_id,
            key_hash=key_hash,
            name=name,
            description=description,
            created_at=datetime.now(timezone.utc),
            expires_at=expires_at,
            is_active=True,
            permissions=permissions or [],
            metadata={}
        )
        
        # Store the key
        self._api_keys[key_id] = api_key
        
        return plain_key, api_key
    
    def validate_api_key(self, key: str) -> Optional[APIKey]:
        """Validate an API key
        
        Args:
            key: The plain text API key to validate
            
        Returns:
            APIKey object if valid, None otherwise
        """
        key_hash = self._hash_key(key)
        
        # Find matching key
        for api_key in self._api_keys.values():
            if api_key.key_hash == key_hash:
                if api_key.is_valid():
                    # Update last used timestamp
                    api_key.last_used_at = datetime.now(timezone.utc)
                    return api_key
                return None
        
        return None
    
    def revoke_api_key(self, key_id: str) -> bool:
        """Revoke an API key
        
        Args:
            key_id: The key ID to revoke
            
        Returns:
            True if revoked, False if not found
        """
        if key_id in self._api_keys:
            self._api_keys[key_id].is_active = False
            return True
        return False
    
    def get_api_key(self, key_id: str) -> Optional[APIKey]:
        """Get API key by ID
        
        Args:
            key_id: The key ID
            
        Returns:
            APIKey object if found, None otherwise
        """
        return self._api_keys.get(key_id)
    
    def list_api_keys(self, include_inactive: bool = False) -> List[APIKey]:
        """List all API keys
        
        Args:
            include_inactive: Include inactive/revoked keys
            
        Returns:
            List of APIKey objects
        """
        if include_inactive:
            return list(self._api_keys.values())
        return [key for key in self._api_keys.values() if key.is_active]
    
    def has_permission(self, api_key: APIKey, permission: str) -> bool:
        """Check if API key has a specific permission
        
        Args:
            api_key: The API key object
            permission: The permission to check (e.g., "products:read")
            
        Returns:
            True if key has permission, False otherwise
        """
        # Check for wildcard permission
        if "*" in api_key.permissions:
            return True
        
        # Check for exact permission match
        if permission in api_key.permissions:
            return True
        
        # Check for resource wildcard (e.g., "*:read" covers "products:read")
        action_type = permission.split(":")[1] if ":" in permission else permission
        if f"*:{action_type}" in api_key.permissions:
            return True
        
        return False


# Global API key handler instance
api_key_handler = APIKeyHandler()

