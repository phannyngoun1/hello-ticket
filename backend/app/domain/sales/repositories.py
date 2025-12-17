"""Repository interface for Customer."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.sales.customer import Customer

@dataclass
class CustomerSearchResult:
    """Result wrapper for customer search operations"""

    items: List[Customer]
    total: int
    has_next: bool

class CustomerRepository(ABC):
    """Port for managing customer master data"""

    @abstractmethod
    async def save(self, customer: Customer) -> Customer:
        """Persist a customer (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, customer_id: str) -> Optional[Customer]:
        """Retrieve customer by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Customer]:
        """Retrieve customer by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> CustomerSearchResult:
        """Search customers by term and status"""

    @abstractmethod
    async def delete(self, tenant_id: str, customer_id: str) -> bool:
        """Delete or soft-delete a customer."""


"""Repository interface for Customer."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.sales.customer import Customer

@dataclass
class CustomerSearchResult:
    """Result wrapper for customer search operations"""

    items: List[Customer]
    total: int
    has_next: bool

class CustomerRepository(ABC):
    """Port for managing customer master data"""

    @abstractmethod
    async def save(self, customer: Customer) -> Customer:
        """Persist a customer (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, customer_id: str) -> Optional[Customer]:
        """Retrieve customer by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Customer]:
        """Retrieve customer by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> CustomerSearchResult:
        """Search customers by term and status"""

    @abstractmethod
    async def delete(self, tenant_id: str, customer_id: str) -> bool:
        """Delete or soft-delete a customer."""


"""Repository interface for Customer."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.sales.customer import Customer

@dataclass
class CustomerSearchResult:
    """Result wrapper for customer search operations"""

    items: List[Customer]
    total: int
    has_next: bool

class CustomerRepository(ABC):
    """Port for managing customer master data"""

    @abstractmethod
    async def save(self, customer: Customer) -> Customer:
        """Persist a customer (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, customer_id: str) -> Optional[Customer]:
        """Retrieve customer by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Customer]:
        """Retrieve customer by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> CustomerSearchResult:
        """Search customers by term and status"""

    @abstractmethod
    async def delete(self, tenant_id: str, customer_id: str) -> bool:
        """Delete or soft-delete a customer."""


"""Repository interface for Customer."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.sales.customer import Customer

@dataclass
class CustomerSearchResult:
    """Result wrapper for customer search operations"""

    items: List[Customer]
    total: int
    has_next: bool

class CustomerRepository(ABC):
    """Port for managing customer master data"""

    @abstractmethod
    async def save(self, customer: Customer) -> Customer:
        """Persist a customer (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, customer_id: str) -> Optional[Customer]:
        """Retrieve customer by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Customer]:
        """Retrieve customer by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> CustomerSearchResult:
        """Search customers by term and status"""

    @abstractmethod
    async def delete(self, tenant_id: str, customer_id: str) -> bool:
        """Delete or soft-delete a customer."""


"""Repository interface for Customer."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.sales.customer import Customer

@dataclass
class CustomerSearchResult:
    """Result wrapper for customer search operations"""

    items: List[Customer]
    total: int
    has_next: bool

class CustomerRepository(ABC):
    """Port for managing customer master data"""

    @abstractmethod
    async def save(self, customer: Customer) -> Customer:
        """Persist a customer (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, customer_id: str) -> Optional[Customer]:
        """Retrieve customer by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Customer]:
        """Retrieve customer by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> CustomerSearchResult:
        """Search customers by term and status"""

    @abstractmethod
    async def delete(self, tenant_id: str, customer_id: str) -> bool:
        """Delete or soft-delete a customer."""


"""Repository interface for Customer."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.sales.customer import Customer

@dataclass
class CustomerSearchResult:
    """Result wrapper for customer search operations"""

    items: List[Customer]
    total: int
    has_next: bool

class CustomerRepository(ABC):
    """Port for managing customer master data"""

    @abstractmethod
    async def save(self, customer: Customer) -> Customer:
        """Persist a customer (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, customer_id: str) -> Optional[Customer]:
        """Retrieve customer by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Customer]:
        """Retrieve customer by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> CustomerSearchResult:
        """Search customers by term and status"""

    @abstractmethod
    async def delete(self, tenant_id: str, customer_id: str) -> bool:
        """Delete or soft-delete a customer."""
