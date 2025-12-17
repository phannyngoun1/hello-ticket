"""
Permission value object for RBAC system
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class Permission:
    """
    Permission value object
    
    Represents a single permission that can be granted to a role.
    Permissions are immutable and use the format: "object:action"
    
    Examples:
        - "product:read"
        - "order:create"
        - "user:update"
        - "product:delete"
        - "integrations:manage"
    """
    name: str
    
    def __post_init__(self):
        """Validate permission format"""
        if not self.name or not isinstance(self.name, str):
            raise ValueError("Permission name must be a non-empty string")
        
        if len(self.name.strip()) == 0:
            raise ValueError("Permission name cannot be empty or whitespace")
    
    def __str__(self) -> str:
        """String representation"""
        return self.name
    
    def __repr__(self) -> str:
        """Debug representation"""
        return f"Permission('{self.name}')"
    
    def __eq__(self, other) -> bool:
        """Equality comparison"""
        if isinstance(other, Permission):
            return self.name == other.name
        return False
    
    def __hash__(self) -> int:
        """Hash for use in sets and dicts"""
        return hash(self.name)

