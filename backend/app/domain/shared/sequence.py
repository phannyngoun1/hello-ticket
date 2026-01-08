"""Sequence aggregate for document code generation"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from pydantic import BaseModel, Field

from app.domain.aggregates.base import AggregateRoot
from app.shared.utils import generate_id


class Sequence(AggregateRoot):
    """Sequence counter for generating document codes"""

    def __init__(
        self,
        tenant_id: str,
        sequence_type: str,
        prefix: str = "",
        digits: int = 6,
        current_value: int = 0,
        description: Optional[str] = None,
        sequence_id: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        self.id = sequence_id or generate_id()
        self.tenant_id = tenant_id
        self.sequence_type = sequence_type.upper()
        self.prefix = prefix
        self.digits = digits
        self.current_value = current_value
        self.description = description
        self._version = version
        now = datetime.now(timezone.utc)
        self.created_at = created_at or now
        self.updated_at = updated_at or now

        self._validate()

    def _validate(self) -> None:
        """Validate sequence configuration"""
        if not self.sequence_type or not self.sequence_type.strip():
            raise ValueError("Sequence type is required")
        if self.digits < 1 or self.digits > 20:
            raise ValueError("Digits must be between 1 and 20")
        if self.current_value < 0:
            raise ValueError("Current value cannot be negative")

    def get_next_code(self) -> str:
        """Generate the next code in the sequence"""
        self.current_value += 1
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
        
        # Format the number with leading zeros
        number_str = str(self.current_value).zfill(self.digits)
        
        # Combine prefix and number
        if self.prefix:
            return f"{self.prefix}{number_str}"
        return number_str

    def reset(self, new_value: int = 0) -> None:
        """Reset the sequence to a new value"""
        if new_value < 0:
            raise ValueError("New value cannot be negative")
        self.current_value = new_value
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()

    def update_config(
        self,
        prefix: Optional[str] = None,
        digits: Optional[int] = None,
        description: Optional[str] = None,
    ) -> None:
        """Update sequence configuration"""
        if prefix is not None:
            self.prefix = prefix
        if digits is not None:
            if digits < 1 or digits > 20:
                raise ValueError("Digits must be between 1 and 20")
            self.digits = digits
        if description is not None:
            self.description = description
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()

