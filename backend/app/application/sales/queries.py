"""sales queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional

@dataclass
class GetCustomerByIdQuery:
    """Query to retrieve a customer by identifier."""

    customer_id: str

@dataclass
class GetCustomerByCodeQuery:
    """Query to retrieve a customer by business code."""

    code: str

@dataclass
class SearchCustomersQuery:
    """Query to search customers with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50


"""sales queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional

@dataclass
class GetCustomerByIdQuery:
    """Query to retrieve a customer by identifier."""

    customer_id: str

@dataclass
class GetCustomerByCodeQuery:
    """Query to retrieve a customer by business code."""

    code: str

@dataclass
class SearchCustomersQuery:
    """Query to search customers with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50


"""sales queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional

@dataclass
class GetCustomerByIdQuery:
    """Query to retrieve a customer by identifier."""

    customer_id: str

@dataclass
class GetCustomerByCodeQuery:
    """Query to retrieve a customer by business code."""

    code: str

@dataclass
class SearchCustomersQuery:
    """Query to search customers with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50


"""sales queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional

@dataclass
class GetCustomerByIdQuery:
    """Query to retrieve a customer by identifier."""

    customer_id: str

@dataclass
class GetCustomerByCodeQuery:
    """Query to retrieve a customer by business code."""

    code: str

@dataclass
class SearchCustomersQuery:
    """Query to search customers with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50


"""sales queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional

@dataclass
class GetCustomerByIdQuery:
    """Query to retrieve a customer by identifier."""

    customer_id: str

@dataclass
class GetCustomerByCodeQuery:
    """Query to retrieve a customer by business code."""

    code: str

@dataclass
class SearchCustomersQuery:
    """Query to search customers with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50


"""sales queries for CQRS pattern."""
from dataclasses import dataclass
from typing import Optional

@dataclass
class GetCustomerByIdQuery:
    """Query to retrieve a customer by identifier."""

    customer_id: str

@dataclass
class GetCustomerByCodeQuery:
    """Query to retrieve a customer by business code."""

    code: str

@dataclass
class SearchCustomersQuery:
    """Query to search customers with optional filters."""

    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 50
