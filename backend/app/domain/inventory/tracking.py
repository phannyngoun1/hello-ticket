"""
Inventory Tracking domain entity - Unified tracking model with type polymorphism
"""
from typing import Optional, Dict
from datetime import date, datetime, timezone
from app.domain.aggregates.base import AggregateRoot
from app.shared.utils import generate_id
from app.shared.enums import TrackingTypeEnum, TrackingStatusEnum
from app.shared.exceptions import BusinessRuleError


class InventoryTracking(AggregateRoot):
    """Unified inventory tracking with type-based polymorphism"""
    
    def __init__(
        self,
        tenant_id: str,
        item_id: str,
        tracking_type: str,
        identifier: str,  # serial_number, etc.
        parent_tracking_id: Optional[str] = None,  # For combinations
        # Type-specific attributes
        expiration_date: Optional[date] = None,  # For EXPIRATION, COMBINED
        manufacturing_date: Optional[date] = None,  # For MANUFACTURING_DATE
        supplier_batch: Optional[str] = None,  # For SUPPLIER_BATCH
        status: str = TrackingStatusEnum.AVAILABLE.value,
        attributes: Optional[Dict] = None,  # Flexible attributes
        tracking_id: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        super().__init__()
        self.id = tracking_id or generate_id()
        self.tenant_id = tenant_id
        self.item_id = item_id
        self.tracking_type = tracking_type
        self.identifier = identifier.strip().upper() if identifier else ""
        self.parent_tracking_id = parent_tracking_id
        self.expiration_date = expiration_date
        self.manufacturing_date = manufacturing_date
        self.supplier_batch = supplier_batch
        self.status = status
        self.attributes = attributes or {}
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)
        
        # Validate type-specific attributes
        self._validate_type_attributes()
    
    def _validate_type_attributes(self) -> None:
        """Validate that type-specific attributes are appropriate"""
        # Normalize tracking_type to lowercase string for comparison
        if isinstance(self.tracking_type, TrackingTypeEnum):
            tracking_type_value = self.tracking_type.value.lower()
        elif isinstance(self.tracking_type, str):
            tracking_type_value = self.tracking_type.lower()
            # Validate it's a valid enum value
            try:
                TrackingTypeEnum(tracking_type_value)
            except ValueError:
                raise BusinessRuleError(
                    f"Invalid tracking_type: {self.tracking_type}. "
                    f"Must be one of: {[e.value for e in TrackingTypeEnum]}"
                )
        else:
            raise BusinessRuleError(
                f"tracking_type must be string or TrackingTypeEnum, got {type(self.tracking_type)}"
            )
        
        if not self.identifier or not self.identifier.strip():
            raise BusinessRuleError(f"{tracking_type_value} tracking must have identifier")
        
        if tracking_type_value == TrackingTypeEnum.SERIAL.value:
            # Serial should not have expiration_date or manufacturing_date by default
            # (can be added via parent_tracking_id)
            pass
        
        elif tracking_type_value == TrackingTypeEnum.EXPIRATION.value:
            # Expiration must have expiration_date
            if not self.expiration_date:
                raise BusinessRuleError("Expiration tracking must have expiration_date")
        
        elif tracking_type_value == TrackingTypeEnum.MANUFACTURING_DATE.value:
            # Manufacturing date must have manufacturing_date
            if not self.manufacturing_date:
                raise BusinessRuleError("Manufacturing date tracking must have manufacturing_date")
        
        elif tracking_type_value == TrackingTypeEnum.SUPPLIER_BATCH.value:
            # Supplier batch should have supplier_batch
            if not self.supplier_batch:
                raise BusinessRuleError("Supplier batch tracking must have supplier_batch")
        
        elif tracking_type_value == TrackingTypeEnum.COMBINED.value:
            # Combined should have parent
            if not self.parent_tracking_id:
                raise BusinessRuleError("Combined tracking must have parent_tracking_id")
    
    def update(
        self,
        identifier: Optional[str] = None,
        expiration_date: Optional[date] = None,
        manufacturing_date: Optional[date] = None,
        supplier_batch: Optional[str] = None,
        status: Optional[str] = None,
        attributes: Optional[Dict] = None
    ):
        """Update tracking details"""
        if identifier:
            self.identifier = identifier.strip().upper()
        if expiration_date is not None:
            self.expiration_date = expiration_date
        if manufacturing_date is not None:
            self.manufacturing_date = manufacturing_date
        if supplier_batch:
            self.supplier_batch = supplier_batch
        if status:
            # Validate and normalize status
            if isinstance(status, TrackingStatusEnum):
                self.status = status.value
            elif isinstance(status, str):
                try:
                    TrackingStatusEnum(status.lower())
                    self.status = status.lower()
                except ValueError:
                    raise BusinessRuleError(
                        f"Invalid status: {status}. "
                        f"Must be one of: {[e.value for e in TrackingStatusEnum]}"
                    )
            else:
                raise BusinessRuleError(
                    f"status must be string or TrackingStatusEnum, got {type(status)}"
                )
        if attributes is not None:
            self.attributes.update(attributes)
        
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()
        
        # Re-validate after update
        self._validate_type_attributes()
    
    def is_expired(self) -> bool:
        """Check if tracking is expired"""
        if self.expiration_date:
            return self.expiration_date < date.today()
        return False
    
    def is_available(self) -> bool:
        """Check if tracking is available for use"""
        if self.status != TrackingStatusEnum.AVAILABLE.value:
            return False
        return not self.is_expired()
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "item_id": self.item_id,
            "tracking_type": self.tracking_type,
            "identifier": self.identifier,
            "parent_tracking_id": self.parent_tracking_id,
            "expiration_date": self.expiration_date.isoformat() if self.expiration_date else None,
            "manufacturing_date": self.manufacturing_date.isoformat() if self.manufacturing_date else None,
            "supplier_batch": self.supplier_batch,
            "status": self.status,
            "attributes": self.attributes,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
    
    @classmethod
    def create_serial(
        cls,
        tenant_id: str,
        item_id: str,
        serial_number: str,
        status: str = TrackingStatusEnum.AVAILABLE.value
    ) -> "InventoryTracking":
        """Factory method to create serial tracking"""
        return cls(
            tenant_id=tenant_id,
            item_id=item_id,
            tracking_type=TrackingTypeEnum.SERIAL.value,  # Use .value for consistency
            identifier=serial_number,
            status=status
        )
    
    @classmethod
    def create_expiration(
        cls,
        tenant_id: str,
        item_id: str,
        expiration_date: date,
        parent_tracking_id: Optional[str] = None,
        status: str = TrackingStatusEnum.AVAILABLE.value
    ) -> "InventoryTracking":
        """Factory method to create expiration tracking"""
        identifier = f"EXP-{expiration_date.isoformat()}"
        return cls(
            tenant_id=tenant_id,
            item_id=item_id,
            tracking_type=TrackingTypeEnum.EXPIRATION.value,  # Use .value for consistency
            identifier=identifier,
            expiration_date=expiration_date,
            parent_tracking_id=parent_tracking_id,
            status=status
        )
    
    @classmethod
    def create_manufacturing_date(
        cls,
        tenant_id: str,
        item_id: str,
        manufacturing_date: date,
        parent_tracking_id: Optional[str] = None,
        status: str = TrackingStatusEnum.AVAILABLE.value
    ) -> "InventoryTracking":
        """Factory method to create manufacturing date tracking"""
        identifier = f"MFG-{manufacturing_date.isoformat()}"
        return cls(
            tenant_id=tenant_id,
            item_id=item_id,
            tracking_type=TrackingTypeEnum.MANUFACTURING_DATE.value,  # Use .value for consistency
            identifier=identifier,
            manufacturing_date=manufacturing_date,
            parent_tracking_id=parent_tracking_id,
            status=status
        )
    
    @classmethod
    def create_supplier_batch(
        cls,
        tenant_id: str,
        item_id: str,
        supplier_batch: str,
        parent_tracking_id: Optional[str] = None,
        status: str = TrackingStatusEnum.AVAILABLE.value
    ) -> "InventoryTracking":
        """Factory method to create supplier batch tracking"""
        return cls(
            tenant_id=tenant_id,
            item_id=item_id,
            tracking_type=TrackingTypeEnum.SUPPLIER_BATCH.value,  # Use .value for consistency
            identifier=supplier_batch,
            supplier_batch=supplier_batch,
            parent_tracking_id=parent_tracking_id,
            status=status
        )
    
    @classmethod
    def create_combined(
        cls,
        tenant_id: str,
        item_id: str,
        identifier: str,
        parent_tracking_id: str,
        expiration_date: Optional[date] = None,
        manufacturing_date: Optional[date] = None,
        **attributes
    ) -> "InventoryTracking":
        """Factory method to create combined tracking"""
        return cls(
            tenant_id=tenant_id,
            item_id=item_id,
            tracking_type=TrackingTypeEnum.COMBINED.value,  # Use .value for consistency
            identifier=identifier,
            parent_tracking_id=parent_tracking_id,
            expiration_date=expiration_date,
            manufacturing_date=manufacturing_date,
            attributes=attributes
        )

