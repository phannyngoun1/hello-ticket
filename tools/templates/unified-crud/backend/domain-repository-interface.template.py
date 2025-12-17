"""Repository interface for {{EntityName}}."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.{{moduleName}}.{{EntityNameLower}} import {{EntityName}}


@dataclass
class {{EntityName}}SearchResult:
    """Result wrapper for {{EntityNameLower}} search operations"""

    items: List[{{EntityName}}]
    total: int
    has_next: bool


class {{EntityName}}Repository(ABC):
    """Port for managing {{EntityNameLower}} master data"""

    @abstractmethod
    async def save(self, {{EntityNameLower}}: {{EntityName}}) -> {{EntityName}}:
        """Persist a {{EntityNameLower}} (create or update)"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, {{EntityNameLower}}_id: str) -> Optional[{{EntityName}}]:
        """Retrieve {{EntityNameLower}} by identifier scoped to tenant"""

    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[{{EntityName}}]:
        """Retrieve {{EntityNameLower}} by business code"""

    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> {{EntityName}}SearchResult:
        """Search {{EntityNamePluralLower}} by term and status"""

    @abstractmethod
    async def delete(self, tenant_id: str, {{EntityNameLower}}_id: str, hard_delete: bool = False) -> bool:
        """Delete a {{EntityNameLower}}.
        
        Args:
            tenant_id: Tenant identifier
            {{EntityNameLower}}_id: {{EntityName}} identifier
            hard_delete: If True, permanently delete from database. If False, soft-delete (mark inactive).
        
        Returns:
            True if deleted, False if not found
        """

