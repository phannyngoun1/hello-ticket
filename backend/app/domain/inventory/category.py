"""
Item Category domain entity - Hierarchical category/group with nested support
"""
from typing import Optional, List
from datetime import datetime, timezone
from app.domain.aggregates.base import AggregateRoot
from app.domain.shared.value_objects.name import Name
from app.shared.utils import generate_id
from app.shared.exceptions import BusinessRuleError, ValidationError


class ItemCategory(AggregateRoot):
    """Item Category aggregate root - manages hierarchical item categories"""
    
    def __init__(
        self,
        tenant_id: str,
        code: str,
        name: str,
        category_id: Optional[str] = None,
        parent_category_id: Optional[str] = None,
        description: Optional[str] = None,
        level: int = 0,
        sort_order: int = 0,
        is_active: bool = True,
        attributes: Optional[dict] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        super().__init__()
        self.id = category_id or generate_id()
        self.tenant_id = tenant_id
        self.code = self._validate_code(code)
        self._name = Name(name)
        self.description = description
        self.parent_category_id = parent_category_id
        self.level = level
        self.sort_order = sort_order
        self.is_active = is_active
        self.attributes = attributes or {}
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)
        
        # Validate hierarchy
        if parent_category_id:
            self.level = level if level > 0 else 1  # Default to 1 if parent exists
        else:
            self.level = 0  # Root category
    
    @property
    def name(self) -> str:
        """Get category name"""
        return self._name.value
    
    def _validate_code(self, code: str) -> str:
        """Validate category code"""
        if not code or not code.strip():
            raise ValidationError("Category code cannot be empty")
        code = code.strip().upper()
        if len(code) > 50:
            raise ValidationError("Category code cannot exceed 50 characters")
        # Validate format: alphanumeric, underscores, hyphens only
        if not code.replace('_', '').replace('-', '').isalnum():
            raise ValidationError("Category code can only contain letters, numbers, underscores, and hyphens")
        return code
    
    def update_name(self, name: str) -> None:
        """Update category name"""
        self._name = Name(name)
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def update_code(self, code: str) -> None:
        """Update category code"""
        self.code = self._validate_code(code)
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def update_description(self, description: Optional[str]) -> None:
        """Update category description"""
        self.description = description
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def set_parent(self, parent_category_id: Optional[str], level: Optional[int] = None) -> None:
        """Set parent category (for hierarchy)"""
        # Cannot set self as parent
        if parent_category_id == self.id:
            raise BusinessRuleError("Category cannot be its own parent")
        
        self.parent_category_id = parent_category_id
        if parent_category_id:
            # If level is provided, use it; otherwise calculate or default to parent_level + 1
            self.level = level if level is not None else (self.level + 1 if self.level == 0 else self.level)
        else:
            # Root category
            self.level = 0
        
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def update_sort_order(self, sort_order: int) -> None:
        """Update sort order"""
        self.sort_order = sort_order
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def activate(self) -> None:
        """Activate category"""
        if self.is_active:
            raise BusinessRuleError("Category is already active")
        self.is_active = True
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def deactivate(self) -> None:
        """Deactivate category"""
        if not self.is_active:
            raise BusinessRuleError("Category is already inactive")
        # TODO: Check if category has active items before deactivating
        self.is_active = False
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def is_root(self) -> bool:
        """Check if category is root (no parent)"""
        return self.parent_category_id is None
    
    def has_parent(self) -> bool:
        """Check if category has a parent"""
        return self.parent_category_id is not None
    
    def get_full_path(self, category_path: Optional[List[str]] = None) -> str:
        """Get full category path (e.g., "Electronics > Computers > Laptops")"""
        # This would need repository to resolve full path
        # For now, return just the name
        return self.name
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, ItemCategory):
            return False
        return self.id == other.id
    
    def __hash__(self) -> int:
        return hash(self.id)

