"""
Name value object
"""
from dataclasses import dataclass
from typing import Optional
from app.shared.exceptions import ValidationError
from app.shared.utils import sanitize_string


@dataclass(frozen=True)
class Name:
    """Name value object"""
    value: str
    
    def __post_init__(self) -> None:
        sanitized = sanitize_string(self.value)
        
        if not sanitized:
            raise ValidationError("Name cannot be empty")
        
        if len(sanitized) < 2:
            raise ValidationError("Name must be at least 2 characters long")
        
        if len(sanitized) > 100:
            raise ValidationError("Name cannot exceed 100 characters")
        
        # Update the value with sanitized version
        object.__setattr__(self, 'value', sanitized)
    
    def __str__(self) -> str:
        return self.value
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Name):
            return False
        return self.value == other.value
    
    def __hash__(self) -> int:
        return hash(self.value)

