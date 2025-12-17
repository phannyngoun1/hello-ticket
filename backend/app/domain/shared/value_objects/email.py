"""
Email value object
"""
from dataclasses import dataclass
from typing import Optional
from app.shared.exceptions import ValidationError
from app.shared.utils import validate_email as _validate_email


@dataclass(frozen=True)
class Email:
    """Email value object"""
    value: str
    
    def __post_init__(self) -> None:
        if not self.value:
            raise ValidationError("Email cannot be empty")
        
        if not _validate_email(self.value):
            raise ValidationError(f"Invalid email format: {self.value}")
    
    def __str__(self) -> str:
        return self.value
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Email):
            return False
        return self.value == other.value
    
    def __hash__(self) -> int:
        return hash(self.value)

