"""
Inventory mappers - handles conversion between domain entities and database models
"""
from decimal import Decimal
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from app.domain.inventory.balance import InventoryBalance
from app.domain.inventory.item import Item
from app.domain.inventory.serial import Serial, SerialStatus
from app.infrastructure.shared.database.models import (
    InventoryBalanceModel,
    ItemModel,
    SerialModel,
    ItemUoMMappingModel
)
from app.shared.enums import ItemTypeEnum, ItemUsageEnum, TrackingScopeEnum
from app.shared.utils import generate_id
from sqlmodel import Session, select


class InventoryBalanceMapper:
    """Mapper for InventoryBalance aggregate to InventoryBalanceModel conversion"""
    
    @staticmethod
    def to_domain(model: InventoryBalanceModel) -> InventoryBalance:
        """Convert database model to domain aggregate"""
        if not model.location_id:
            raise ValueError(f"InventoryBalance {model.id} must have location_id")
        
        return InventoryBalance(
            balance_id=model.id,
            tenant_id=model.tenant_id,
            item_id=model.item_id,
            location_id=model.location_id,
            tracking_id=model.tracking_id,
            status=model.status,
            quantity=model.quantity,
            version=model.version,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    @staticmethod
    def to_model(balance: InventoryBalance) -> InventoryBalanceModel:
        """Convert domain aggregate to database model"""
        return InventoryBalanceModel(
            id=balance.id,
            tenant_id=balance.tenant_id,
            item_id=balance.item_id,
            location_id=balance.location_id,
            tracking_id=balance.tracking_id,
            status=balance.status,
            quantity=balance.quantity,
            version=balance.get_version(),
            created_at=balance.created_at,
            updated_at=balance.updated_at
        )


class SerialMapper:
    """Mapper for Serial entity to SerialModel conversion"""
    
    @staticmethod
    def to_domain(model: SerialModel) -> Serial:
        """Convert database model to domain entity"""
        return Serial(
            serial_id=model.id,
            tenant_id=model.tenant_id,
            item_id=model.item_id,
            serial_number=model.serial_number,
            status=SerialStatus(model.status)
        )
    
    @staticmethod
    def to_model(serial: Serial) -> SerialModel:
        """Convert domain entity to database model"""
        return SerialModel(
            id=serial.id,
            tenant_id=serial.tenant_id,
            item_id=serial.item_id,
            serial_number=serial.serial_number,
            status=serial.status.value
        )


class ItemMapper:
    """Mapper for Item aggregate to ItemModel conversion"""
    
    @staticmethod
    def _uom_mapping_dict_from_model(mapping_model: ItemUoMMappingModel) -> Dict[str, Any]:
        """Convert ItemUoMMappingModel to dictionary."""
        return {
            "id": mapping_model.id,
            "context": mapping_model.context,
            "uom_code": mapping_model.uom_code,
            "conversion_factor": float(mapping_model.conversion_factor),
            "is_primary": mapping_model.is_primary,
        }
    
    @staticmethod
    def _load_uom_mappings(session: Session, tenant_id: str, item_id: str) -> List[Dict[str, Any]]:
        """Load UoM mappings for an item."""
        statement = select(ItemUoMMappingModel).where(
            ItemUoMMappingModel.tenant_id == tenant_id,
            ItemUoMMappingModel.item_id == item_id
        )
        mappings = session.exec(statement).all()
        return [ItemMapper._uom_mapping_dict_from_model(m) for m in mappings]
    
    @staticmethod
    def _save_uom_mappings(
        session: Session,
        tenant_id: str,
        item_id: str,
        uom_mappings: Optional[List[Dict[str, Any]]]
    ) -> None:
        """Save or update UoM mappings for an item. Supports multiple UOMs per context."""
        # Load existing mappings
        statement = select(ItemUoMMappingModel).where(
            ItemUoMMappingModel.tenant_id == tenant_id,
            ItemUoMMappingModel.item_id == item_id
        )
        existing_mappings = session.exec(statement).all()
        # Use composite key (context, uom_code) to support multiple UOMs per context
        existing_by_key = {(m.context, m.uom_code): m for m in existing_mappings}
        
        # Process new/updated mappings
        keys_to_keep = set()
        if uom_mappings:
            for mapping_data in uom_mappings:
                context = mapping_data["context"]
                uom_code = mapping_data["uom_code"]
                key = (context, uom_code)
                keys_to_keep.add(key)
                
                if key in existing_by_key:
                    # Update existing mapping
                    existing = existing_by_key[key]
                    existing.conversion_factor = Decimal(str(mapping_data["conversion_factor"]))
                    existing.is_primary = mapping_data.get("is_primary", False)
                    existing.updated_at = datetime.now(timezone.utc)
                    session.add(existing)
                else:
                    # Create new mapping
                    mapping_model = ItemUoMMappingModel(
                        id=mapping_data.get("id") or generate_id(),
                        tenant_id=tenant_id,
                        item_id=item_id,
                        context=context,
                        uom_code=uom_code,
                        conversion_factor=Decimal(str(mapping_data["conversion_factor"])),
                        is_primary=mapping_data.get("is_primary", False),
                    )
                    session.add(mapping_model)
        
        # Delete mappings that are no longer in the list
        for key, mapping in existing_by_key.items():
            if key not in keys_to_keep:
                session.delete(mapping)
    
    @staticmethod
    def to_domain(model: ItemModel, session: Optional[Session] = None) -> Item:
        """Convert database model to domain aggregate"""
        uom_mappings = []
        if session:
            uom_mappings = ItemMapper._load_uom_mappings(session, model.tenant_id, model.id)
        
        # Store uom_mappings in attributes
        attributes = model.attributes or {}
        if uom_mappings:
            attributes["uom_mappings"] = uom_mappings
        
        return Item(
            item_id=model.id,
            tenant_id=model.tenant_id,
            code=model.code,
            sku=model.sku,
            name=model.name,
            default_uom=model.default_uom,
            description=model.description,
            item_group=model.item_group,
            category_id=model.category_id if hasattr(model, 'category_id') else None,
            item_type=model.item_type if hasattr(model, 'item_type') else ItemTypeEnum.PRODUCT.value,
            item_usage=model.item_usage if hasattr(model, 'item_usage') else ItemUsageEnum.FOR_SALE.value,
            tracking_scope=model.tracking_scope if hasattr(model, 'tracking_scope') else TrackingScopeEnum.BOTH.value,
            tracking_requirements=model.tracking_requirements if hasattr(model, 'tracking_requirements') and model.tracking_requirements else None,
            perishable=model.perishable,
            active=model.active,
            attributes=attributes,
            version=0,  # Items don't use version for optimistic locking yet
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    @staticmethod
    def to_model(item: Item, session: Optional[Session] = None) -> ItemModel:
        """Convert domain aggregate to database model"""
        return ItemModel(
            id=item.id,
            tenant_id=item.tenant_id,
            code=item.code,
            sku=item.sku,
            name=item.name,
            description=item.description,
            item_group=item.item_group,
            category_id=item.category_id if hasattr(item, 'category_id') else None,
            item_type=item.item_type,
            item_usage=item.item_usage,
            tracking_scope=item.tracking_scope,
            default_uom=item.default_uom,
            tracking_requirements=item.tracking_requirements,
            perishable=item.perishable,
            active=item.active,
            attributes=item.attributes
        )
    
    @staticmethod
    def apply_to_model(item: Item, model: ItemModel, session: Session) -> None:
        """Apply domain changes to existing ItemModel"""
        model.sku = item.sku
        model.code = item.code
        model.name = item.name
        model.description = item.description
        model.item_group = item.item_group
        model.category_id = item.category_id if hasattr(item, 'category_id') else None
        model.item_type = item.item_type if hasattr(item, 'item_type') else ItemTypeEnum.PRODUCT.value
        model.item_usage = item.item_usage if hasattr(item, 'item_usage') else ItemUsageEnum.FOR_SALE.value
        model.tracking_scope = item.tracking_scope if hasattr(item, 'tracking_scope') else TrackingScopeEnum.BOTH.value
        model.default_uom = item.default_uom
        model.tracking_requirements = item.tracking_requirements if hasattr(item, 'tracking_requirements') else []
        model.perishable = item.perishable
        model.active = item.active
        model.attributes = item.attributes
        model.updated_at = item.updated_at
        
        # Handle UoM mappings
        uom_mappings = item.attributes.get("uom_mappings") if item.attributes else None
        ItemMapper._save_uom_mappings(session, item.tenant_id, item.id, uom_mappings)

