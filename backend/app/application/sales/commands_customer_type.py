"""Sales commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateCustomerTypeCommand:
    """Command to create a new customer_type"""

    code: str
    name: str


@dataclass
class UpdateCustomerTypeCommand:
    """Command to update customer_type details"""

    customer_type_id: str
    code: Optional[str] = None
    name: Optional[str] = None


@dataclass
class DeleteCustomerTypeCommand:
    """Command to remove a customer_type (soft-delete only)"""

    customer_type_id: str



