"""
First Name value object
"""
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class FirstName:
    """First name value object with validation"""
    value: str
    
    def __post_init__(self):
        """Validate first name after initialization"""
        if not self.value:
            raise ValueError("First name cannot be empty")
        
        if len(self.value.strip()) == 0:
            raise ValueError("First name cannot be empty")
        
        if len(self.value) > 50:
            raise ValueError("First name cannot exceed 50 characters")
        
        # Check for invalid characters (basic validation) - more lenient for existing data
        # Allow letters, numbers, spaces, hyphens, apostrophes, and dots
        cleaned_value = self.value.replace(" ", "").replace("-", "").replace("'", "").replace(".", "")
        if not cleaned_value.isalnum():
            raise ValueError("First name can only contain letters, numbers, spaces, hyphens, apostrophes, and dots")
    
    def __str__(self) -> str:
        return self.value
    
    def __repr__(self) -> str:
        return f"FirstName('{self.value}')"
