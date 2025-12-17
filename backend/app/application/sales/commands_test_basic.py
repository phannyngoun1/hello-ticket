"""Sales commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateTestBasicCommand:
    """Command to create a new test_basic"""

    name: str
    code: str


@dataclass
class UpdateTestBasicCommand:
    """Command to update test_basic details"""

    test_basic_id: str
    name: Optional[str] = None
    code: Optional[str] = None


@dataclass
class DeleteTestBasicCommand:
    """Command to remove a test_basic (soft-delete only)"""

    test_basic_id: str



