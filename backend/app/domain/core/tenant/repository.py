"""
Tenant repository interface - Port in Hexagonal Architecture
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.core.tenant.entity import Tenant


class TenantRepository(ABC):
    """Abstract tenant repository"""
    
    @abstractmethod
    async def save(self, tenant: Tenant) -> Tenant:
        """Save or update a tenant"""
        pass
    
    @abstractmethod
    async def get_by_id(self, tenant_id: str) -> Optional[Tenant]:
        """Get tenant by ID"""
        pass
    
    @abstractmethod
    async def get_by_slug(self, slug: str) -> Optional[Tenant]:
        """Get tenant by slug"""
        pass
    
    @abstractmethod
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Tenant]:
        """Get all tenants with pagination"""
        pass
    
    @abstractmethod
    async def delete(self, tenant_id: str) -> bool:
        """Delete tenant by ID"""
        pass
    
    @abstractmethod
    async def exists_by_slug(self, slug: str) -> bool:
        """Check if tenant exists by slug"""
        pass

