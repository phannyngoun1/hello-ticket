"""Sales commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateTestCommand:
    """Command to create a new test"""

    name: str
    code: Optional[str] = None


@dataclass
class UpdateTestCommand:
    """Command to update test details"""

    test_id: str
    name: Optional[str] = None
    code: Optional[str] = None


@dataclass
class DeleteTestCommand:
    """Command to remove a test (soft-delete only)"""

    test_id: str



