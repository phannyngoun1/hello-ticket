"""
Tenant ID value object
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class TenantId:
    """Tenant ID value object"""
    value: str
    
    def __post_init__(self):
        if not self.value or not self.value.strip():
            raise ValueError("Tenant ID cannot be empty")
        
        if len(self.value) > 100:
            raise ValueError("Tenant ID cannot exceed 100 characters")
    
    def __str__(self) -> str:
        return self.value
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, TenantId):
            return False
        return self.value == other.value
    
    def __hash__(self) -> int:
        return hash(self.value)

