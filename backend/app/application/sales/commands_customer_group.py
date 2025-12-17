"""Sales commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateCustomerGroupCommand:
    """Command to create a new customer_group"""

    code: str
    name: str
    parent_id: Optional[str] = None
    sort_order: int = 0


@dataclass
class UpdateCustomerGroupCommand:
    """Command to update customer_group details"""

    customer_group_id: str
    code: Optional[str] = None
    name: Optional[str] = None
    parent_id: Optional[str] = None
    sort_order: Optional[int] = None


@dataclass
class DeleteCustomerGroupCommand:
    """Command to remove a customer_group (soft-delete only)"""

    customer_group_id: str



