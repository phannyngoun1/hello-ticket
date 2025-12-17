"""sales commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional

@dataclass
class CreateCustomerCommand:
    """Command to create a new customer"""
    code: str
    name: str

@dataclass
class UpdateCustomerCommand:
    """Command to update customer details"""

    customer_id: str
    code: Optional[str] = None
    name: Optional[str] = None

@dataclass
class DeleteCustomerCommand:
    """Command to remove a customer"""

    customer_id: str
