"""Sales commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateTestTreeCommand:
    """Command to create a new test_tree"""

    name: str
    code: str
    parent_test_tree_id: Optional[str] = None
    sort_order: int = 0


@dataclass
class UpdateTestTreeCommand:
    """Command to update test_tree details"""

    test_tree_id: str
    name: Optional[str] = None
    code: Optional[str] = None
    parent_test_tree_id: Optional[str] = None
    sort_order: Optional[int] = None


@dataclass
class DeleteTestTreeCommand:
    """Command to remove a test_tree (soft-delete only)"""

    test_tree_id: str



