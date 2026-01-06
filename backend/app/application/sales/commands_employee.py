"""Sales commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateEmployeeCommand:
    """Command to create a new employee"""

    name: str
    code: Optional[str] = None


@dataclass
class UpdateEmployeeCommand:
    """Command to update employee details"""

    employee_id: str
    name: Optional[str] = None
    code: Optional[str] = None


@dataclass
class DeleteEmployeeCommand:
    """Command to remove a employee (soft-delete only)"""

    employee_id: str



