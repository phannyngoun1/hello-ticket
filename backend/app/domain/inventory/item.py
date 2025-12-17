"""
Item aggregate root - represents inventory item master data
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from app.domain.aggregates.base import AggregateRoot
from app.domain.shared.value_objects.name import Name
from app.shared.utils import generate_id
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.enums import TrackingTypeEnum, ItemTypeEnum, ItemUsageEnum, TrackingScopeEnum


class Item(AggregateRoot):
    """Item aggregate root - manages inventory item master data"""
    
    def __init__(
        self,
        tenant_id: str,
        name: str,
        default_uom: str,
        item_id: Optional[str] = None,
        code: Optional[str] = None,
        sku: Optional[str] = None,
        description: Optional[str] = None,
        item_group: Optional[str] = None,  # Legacy field (deprecated)
        category_id: Optional[str] = None,  # Hierarchical category reference
        item_type: str = ItemTypeEnum.PRODUCT.value,
        item_usage: str = ItemUsageEnum.FOR_SALE.value,
        tracking_scope: str = TrackingScopeEnum.INVENTORY_ONLY.value,
        tracking_requirements: Optional[List[str]] = None,
        perishable: bool = False,
        active: bool = True,
        attributes: Optional[Dict[str, Any]] = None,
        version: int = 0,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        super().__init__()
        self.id = item_id or generate_id()
        self.tenant_id = tenant_id
        self._code = self._validate_code(code) if code else None
        self._sku = self._validate_sku(sku) if sku else None
        self._name = Name(name)
        self.description = description
        self.item_group = item_group  # Legacy field (deprecated, use category_id)
        self.category_id = category_id  # Hierarchical category reference
        self.default_uom = default_uom
        
        # Item classification - WHAT the item is
        self.item_type = self._validate_item_type(item_type)
        
        # Item usage/purpose - WHO uses the item (separate from item_type)
        self.item_usage = self._validate_item_usage(item_usage)
        
        # Tracking scope - WHERE the item is tracked
        self.tracking_scope = self._validate_tracking_scope(tracking_scope)
        
        # Unified tracking requirements
        if tracking_requirements is not None:
            self._tracking_requirements = self._validate_tracking_requirements(tracking_requirements)
        else:
            self._tracking_requirements = []
        
        # Validate consistency between item_type, item_usage, tracking_scope, and tracking_requirements
        self._validate_item_configuration()
        
        self.perishable = perishable
        self.active = active
        self.attributes = attributes or {}
        self._version = version
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)
    
    @property
    def sku(self) -> Optional[str]:
        """Get SKU"""
        return self._sku
    
    @property
    def code(self) -> Optional[str]:
        """Get ERP item code"""
        return self._code

    @property
    def name(self) -> str:
        """Get name"""
        return self._name.value
    
    def _validate_code(self, code: Optional[str]) -> Optional[str]:
        """Validate item code format"""
        if code is None:
            return None
        if not code or not code.strip():
            raise ValidationError("Item code cannot be empty if provided")
        code = code.strip().upper()
        if len(code) > 100:
            raise ValidationError("Item code cannot exceed 100 characters")
        return code

    def _validate_sku(self, sku: Optional[str]) -> Optional[str]:
        """Validate SKU format"""
        if sku is None:
            return None
        if not sku or not sku.strip():
            raise ValidationError("SKU cannot be empty if provided")
        sku = sku.strip().upper()
        if len(sku) > 100:
            raise ValidationError("SKU cannot exceed 100 characters")
        return sku
    
    def update_sku(self, sku: Optional[str]) -> None:
        """Update item SKU"""
        self._sku = self._validate_sku(sku) if sku else None
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def update_code(self, code: Optional[str]) -> None:
        """Update item ERP code"""
        self._code = self._validate_code(code) if code else None
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def update_name(self, name: str) -> None:
        """Update item name"""
        self._name = Name(name)
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def update_description(self, description: Optional[str]) -> None:
        """Update item description"""
        self.description = description
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def update_item_group(self, item_group: Optional[str]) -> None:
        """Update item group"""
        self.item_group = item_group
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def update_category(self, category_id: Optional[str]) -> None:
        """Update hierarchical category reference"""
        self.category_id = category_id.strip() if isinstance(category_id, str) and category_id.strip() else None
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()

    def update_default_uom(self, default_uom: str) -> None:
        """Update default unit of measure"""
        if not default_uom or not default_uom.strip():
            raise ValidationError("Default UOM cannot be empty")
        self.default_uom = default_uom.strip()
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def enable_serial_tracking(self) -> None:
        """Enable serial number tracking (legacy method, updates tracking_requirements)"""
        if self.requires_serial_tracking():
            raise BusinessRuleError("Serial tracking is already enabled")
        requirements = self._tracking_requirements.copy()
        if TrackingTypeEnum.SERIAL.value not in requirements:
            requirements.append(TrackingTypeEnum.SERIAL.value)
        self.set_tracking_requirements(requirements)
    
    def disable_serial_tracking(self) -> None:
        """Disable serial number tracking (legacy method, updates tracking_requirements)"""
        if not self.requires_serial_tracking():
            raise BusinessRuleError("Serial tracking is not enabled")
        # TODO: Check if there are existing serials before disabling
        requirements = [r for r in self._tracking_requirements if r != TrackingTypeEnum.SERIAL.value]
        self.set_tracking_requirements(requirements)
    
    def set_perishable(self, perishable: bool) -> None:
        """Set perishable flag"""
        self.perishable = perishable
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def activate(self) -> None:
        """Activate item"""
        if self.active:
            raise BusinessRuleError("Item is already active")
        self.active = True
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def deactivate(self) -> None:
        """Deactivate item"""
        if not self.active:
            raise BusinessRuleError("Item is already inactive")
        self.active = False
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def update_attribute(self, key: str, value: Any) -> None:
        """Update or add an attribute"""
        self.attributes[key] = value
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def remove_attribute(self, key: str) -> None:
        """Remove an attribute"""
        if key in self.attributes:
            del self.attributes[key]
            self.updated_at = datetime.now(timezone.utc)
            self.increment_version()
    
    def get_version(self) -> int:
        """Get aggregate version for optimistic locking"""
        return self._version
    
    @property
    def tracking_requirements(self) -> List[str]:
        """Get tracking requirements (preferred method)"""
        return self._tracking_requirements.copy()
    
    def requires_tracking_type(self, tracking_type: str) -> bool:
        """Check if item requires a specific tracking type"""
        return tracking_type.lower() in [t.lower() for t in self._tracking_requirements]
    
    
    def requires_serial_tracking(self) -> bool:
        """Check if item requires serial tracking (legacy method, uses tracking_requirements)"""
        return self.requires_tracking_type(TrackingTypeEnum.SERIAL.value)
    
    def _validate_tracking_requirements(self, requirements: List[str]) -> List[str]:
        """Validate tracking requirements against TrackingTypeEnum"""
        if not isinstance(requirements, list):
            raise ValidationError("tracking_requirements must be a list")
        
        valid_types = {e.value for e in TrackingTypeEnum}
        normalized = []
        
        for req in requirements:
            if not isinstance(req, str):
                raise ValidationError(f"Tracking requirement must be a string, got {type(req)}")
            
            req_lower = req.lower()
            if req_lower not in valid_types:
                raise ValidationError(
                    f"Invalid tracking type: {req}. "
                    f"Must be one of: {sorted(valid_types)}"
                )
            normalized.append(req_lower)
        
        return normalized
    
    def set_tracking_requirements(self, requirements: List[str]) -> None:
        """Update tracking requirements"""
        self._tracking_requirements = self._validate_tracking_requirements(requirements)
        self._validate_item_configuration()
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def _validate_item_type(self, item_type: str) -> str:
        """Validate item type"""
        try:
            ItemTypeEnum(item_type.lower())
            return item_type.lower()
        except ValueError:
            valid_types = [e.value for e in ItemTypeEnum]
            raise ValidationError(
                f"Invalid item_type: {item_type}. Must be one of: {valid_types}"
            )
    
    def _validate_item_usage(self, item_usage: str) -> str:
        """Validate item usage/purpose"""
        try:
            ItemUsageEnum(item_usage.lower())
            return item_usage.lower()
        except ValueError:
            valid_usages = [e.value for e in ItemUsageEnum]
            raise ValidationError(
                f"Invalid item_usage: {item_usage}. Must be one of: {valid_usages}"
            )
    
    def _validate_tracking_scope(self, tracking_scope: str) -> str:
        """Validate tracking scope"""
        try:
            TrackingScopeEnum(tracking_scope.lower())
            return tracking_scope.lower()
        except ValueError:
            valid_scopes = [e.value for e in TrackingScopeEnum]
            raise ValidationError(
                f"Invalid tracking_scope: {tracking_scope}. Must be one of: {valid_scopes}"
            )
    
    def _validate_item_configuration(self) -> None:
        """Validate consistency between item_type, item_usage, tracking_scope, and tracking_requirements"""
        # Services typically don't need inventory tracking
        if self.item_type == ItemTypeEnum.SERVICE.value:
            if self.tracking_scope == TrackingScopeEnum.INVENTORY_ONLY.value:
                raise BusinessRuleError(
                    "Service items should not be tracked in inventory. "
                    "Use tracking_scope='none' for services."
                )
            # Services are typically for sale, not internal use
            if self.item_usage == ItemUsageEnum.INTERNAL_USE.value:
                raise BusinessRuleError(
                    "Service items are typically for sale. "
                    "Use item_usage='for_sale' or 'both' for services."
                )
        
        # Raw materials are typically for internal use (production)
        if self.item_type == ItemTypeEnum.RAW_MATERIAL.value:
            if self.item_usage == ItemUsageEnum.FOR_SALE.value:
                # Allow but warn - raw materials can be sold, but uncommon
                pass
        
        # WIP items are always for internal use (production)
        if self.item_type == ItemTypeEnum.WIP.value:
            if self.item_usage == ItemUsageEnum.FOR_SALE.value:
                raise BusinessRuleError(
                    "WIP (Work in Progress) items are for internal use only. "
                    "Use item_usage='internal_use' for WIP items."
                )
        
        # Manufacturing staging items are for internal use
        if self.item_type == ItemTypeEnum.MANUFACTURING_STAGING.value:
            if self.item_usage == ItemUsageEnum.FOR_SALE.value:
                raise BusinessRuleError(
                    "Manufacturing staging items are for internal use only. "
                    "Use item_usage='internal_use' for manufacturing staging items."
                )
        
        # Items with tracking_scope='none' should not have tracking requirements
        if self.tracking_scope == TrackingScopeEnum.NONE.value:
            if self._tracking_requirements:
                raise BusinessRuleError(
                    "Items with tracking_scope='none' cannot have tracking_requirements. "
                    "Remove tracking requirements or change tracking_scope."
                )
        
        # WIP and manufacturing staging items typically need tracking
        if self.item_type in [ItemTypeEnum.WIP.value, ItemTypeEnum.MANUFACTURING_STAGING.value]:
            if self.tracking_scope == TrackingScopeEnum.NONE.value:
                raise BusinessRuleError(
                    f"Items of type '{self.item_type}' should have tracking enabled. "
                    "Set tracking_scope to 'inventory_only'."
                )
    
    def update_item_type(self, item_type: str) -> None:
        """Update item type"""
        old_type = self.item_type
        self.item_type = self._validate_item_type(item_type)
        self._validate_item_configuration()
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def update_item_usage(self, item_usage: str) -> None:
        """Update item usage/purpose"""
        self.item_usage = self._validate_item_usage(item_usage)
        self._validate_item_configuration()
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def update_tracking_scope(self, tracking_scope: str) -> None:
        """Update tracking scope"""
        self.tracking_scope = self._validate_tracking_scope(tracking_scope)
        self._validate_item_configuration()
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
    
    def is_for_sale(self) -> bool:
        """Check if item is for sale"""
        return self.item_usage in [
            ItemUsageEnum.FOR_SALE.value,
            ItemUsageEnum.BOTH.value
        ]
    
    def is_internal_use(self) -> bool:
        """Check if item is for internal use"""
        return self.item_usage in [
            ItemUsageEnum.INTERNAL_USE.value,
            ItemUsageEnum.BOTH.value
        ]
    
    def requires_inventory_tracking(self) -> bool:
        """Check if item requires inventory tracking"""
        return self.tracking_scope == TrackingScopeEnum.INVENTORY_ONLY.value
    
    def is_service(self) -> bool:
        """Check if item is a service"""
        return self.item_type == ItemTypeEnum.SERVICE.value
    
    def is_physical_item(self) -> bool:
        """Check if item is a physical item (not a service)"""
        return self.item_type != ItemTypeEnum.SERVICE.value
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Item):
            return False
        return self.id == other.id
    
    def __hash__(self) -> int:
        return hash(self.id)

