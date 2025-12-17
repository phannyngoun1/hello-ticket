"""
Inventory command and query handlers
"""
import logging
from decimal import Decimal
from datetime import datetime, timezone, date
from typing import Optional, List, Dict, Any
from .commands import (
    CreateItemCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    ReceiveInventoryCommand,
    IssueInventoryCommand,
    AdjustInventoryCommand,
    MoveInventoryCommand,
    ReserveInventoryCommand,
    ReleaseReservationCommand,
    CreateUnitOfMeasureCommand,
    UpdateUnitOfMeasureCommand,
    DeleteUnitOfMeasureCommand,
    CreateCategoryCommand,
    UpdateCategoryCommand,
    DeleteCategoryCommand,
)
from .queries import (
    GetItemByIdQuery,
    GetItemBySkuQuery,
    GetAllItemsQuery,
    SearchItemsQuery,
    GetItemsByIdsQuery,
    GetInventoryBalanceQuery,
    GetAvailableQuantityQuery,
    GetBalancesByItemQuery,
    GetTransactionHistoryQuery,
    GetTransactionsByReferenceQuery,
    GetTransactionsByDateRangeQuery,
    GetUnitOfMeasureByIdQuery,
    GetUnitOfMeasureByCodeQuery,
    GetAllUnitsOfMeasureQuery,
    SearchUnitsOfMeasureQuery,
    GetCategoryByIdQuery,
    GetCategoryByCodeQuery,
    GetAllCategoriesQuery,
    GetCategoryTreeQuery,
    GetCategoryHierarchyQuery,
    GetCategoryChildrenQuery,
)
from app.domain.inventory.item import Item
from app.domain.inventory.category import ItemCategory
from app.shared.enums import ItemTypeEnum, ItemUsageEnum, TrackingScopeEnum
from app.domain.inventory.balance import InventoryBalance
from app.domain.inventory.serial import Serial, SerialStatus
from app.domain.inventory.tracking import InventoryTracking
from app.domain.inventory.repositories import (
    ItemRepository,
    InventoryBalanceRepository,
    SerialRepository,
    InventoryTrackingRepository,
    InventoryTransactionRepository,
    UnitOfMeasureRepository,
    ItemCategoryRepository,
)
from app.shared.exceptions import NotFoundError, BusinessRuleError, ValidationError, ConflictError
from app.shared.tenant_context import require_tenant_context
from app.shared.utils import generate_id
from app.shared.unit_of_work import unit_of_work

logger = logging.getLogger(__name__)


class InventoryCommandHandler:
    """Handler for inventory commands"""
    
    def __init__(
        self,
        item_repository: ItemRepository,
        balance_repository: InventoryBalanceRepository,
        serial_repository: SerialRepository,
        tracking_repository: InventoryTrackingRepository,
        transaction_repository: InventoryTransactionRepository,
        uom_repository: Optional[UnitOfMeasureRepository] = None,
        category_repository: Optional[ItemCategoryRepository] = None,
    ):
        self._item_repository = item_repository
        self._balance_repository = balance_repository
        self._serial_repository = serial_repository
        self._tracking_repository = tracking_repository
        self._transaction_repository = transaction_repository
        self._uom_repository = uom_repository
        self._category_repository = category_repository
    
    # Item Management Commands
    
    async def handle_create_item(self, command: CreateItemCommand) -> Item:
        """Handle create item command"""
        tenant_id = require_tenant_context()
        
        # Check if code already exists (only if provided)
        if getattr(command, 'code', None):
            existing_by_code = await self._item_repository.get_by_code(tenant_id, command.code)  # type: ignore[arg-type]
            if existing_by_code:
                raise BusinessRuleError(f"Item with code {command.code} already exists")
        
        # Check if SKU already exists (only if SKU is provided)
        if command.sku:
            existing_item = await self._item_repository.get_by_sku(tenant_id, command.sku)
            if existing_item:
                raise BusinessRuleError(f"Item with SKU {command.sku} already exists")
        
        # Create new item
        item = Item(
            tenant_id=tenant_id,
            name=command.name,
            default_uom=command.default_uom,
            code=command.code,
            sku=command.sku,
            description=command.description,
            item_group=command.item_group,
            category_id=command.category_id,
            item_type=command.item_type or ItemTypeEnum.PRODUCT.value,
            item_usage=command.item_usage or ItemUsageEnum.FOR_SALE.value,
            tracking_scope=command.tracking_scope or TrackingScopeEnum.BOTH.value,
            tracking_requirements=command.tracking_requirements,
            perishable=command.perishable,
            attributes={
                **(command.attributes or {}),
                **({"uom_mappings": command.uom_mappings} if command.uom_mappings else {})
            }
        )
        
        return await self._item_repository.save(item)
    
    async def handle_update_item(self, command: UpdateItemCommand) -> Item:
        """Handle update item command"""
        tenant_id = require_tenant_context()
        
        
        item = await self._item_repository.get_by_id(command.item_id)
        if not item:
            raise NotFoundError(f"Item with ID {command.item_id} not found")
        
        if item.tenant_id != tenant_id:
            raise NotFoundError(f"Item with ID {command.item_id} not found")

        if command.code is not None:
            if command.code and command.code != item.code:
                existing_item = await self._item_repository.get_by_code(tenant_id, command.code)
                if existing_item:
                    raise BusinessRuleError(f"Item with code {command.code} already exists")
            item.update_code(command.code)
        
        # Update fields if provided
        if command.sku is not None:
            # Check if new SKU already exists (only if SKU is being set/changed)
            if command.sku and command.sku != item.sku:
                existing_item = await self._item_repository.get_by_sku(tenant_id, command.sku)
                if existing_item:
                    raise BusinessRuleError(f"Item with SKU {command.sku} already exists")
            item.update_sku(command.sku)
        
        if command.name:
            item.update_name(command.name)
        
        if command.description is not None:
            item.update_description(command.description)
        
        if command.item_group is not None:
            item.update_item_group(command.item_group)
        
        if command.category_id is not None:
            item.update_category(command.category_id)

        if command.item_type is not None:
            item.update_item_type(command.item_type)
        
        if command.item_usage is not None:
            item.update_item_usage(command.item_usage)
        
        if command.tracking_scope is not None:
            item.update_tracking_scope(command.tracking_scope)
        
        if command.default_uom:
            item.update_default_uom(command.default_uom)
        
        if command.tracking_requirements is not None:
            item.set_tracking_requirements(command.tracking_requirements)
        
        if command.perishable is not None:
            item.set_perishable(command.perishable)
        
        if command.active is not None and command.active != item.is_active:
            if command.active:
                item.activate()
            else:
                item.deactivate()
        
        if command.attributes:
            for key, value in command.attributes.items():
                item.update_attribute(key, value)
        
        if command.uom_mappings is not None:
            item.update_attribute("uom_mappings", command.uom_mappings)
        
        return await self._item_repository.save(item)
    
    async def handle_delete_item(self, command: DeleteItemCommand) -> bool:
        """Handle delete item command"""
        tenant_id = require_tenant_context()
        
        item = await self._item_repository.get_by_id(command.item_id)
        if not item:
            raise NotFoundError(f"Item with ID {command.item_id} not found")
        
        if item.tenant_id != tenant_id:
            raise NotFoundError(f"Item with ID {command.item_id} not found")
        
        return await self._item_repository.delete(command.item_id)
    
    # Inventory Operations
    
    async def handle_receive_inventory(self, command: ReceiveInventoryCommand) -> dict:
        """Handle receive inventory command"""
        tenant_id = require_tenant_context()
        
        logger.info(
            f"Receiving inventory: item={command.item_id}, quantity={command.quantity}, "
            f"location={command.location_id}, tenant={tenant_id}"
        )
        
        # Validate command input
        if command.quantity <= 0:
            raise ValidationError("Quantity must be greater than zero")
        
        if command.cost_per_unit < 0:
            raise ValidationError("Cost per unit cannot be negative")
        
        if command.expiration_date and command.expiration_date < date.today():
            raise ValidationError("Expiration date cannot be in the past")
        
        # Get item
        item = await self._item_repository.get_by_id(command.item_id)
        if not item:
            raise NotFoundError(f"Item with ID {command.item_id} not found")
        
        if item.tenant_id != tenant_id:
            raise NotFoundError(f"Item with ID {command.item_id} not found")
        
        # Handle tracking if required (unified model)
        # Validate required tracking fields
        if item.requires_tracking_type("expiration") and not command.expiration_date:
            raise ValidationError("Expiration date is required for this item")
        if item.requires_tracking_type("manufacturing_date") and not command.manufacturing_date:
            raise ValidationError("Manufacturing date is required for this item")
        if item.requires_tracking_type("supplier_batch") and not command.supplier_batch:
            raise ValidationError("Supplier batch is required for this item")

        # Handle tracking if required (unified model)
        tracking_id = None
        
        # 1. Serial Tracking (Highest Priority - Individual Units)
        if command.serial_numbers and len(command.serial_numbers) > 0:
            # Validate quantity matches serial numbers if item requires serial tracking
            if item.requires_serial_tracking() and len(command.serial_numbers) != 1:
                raise BusinessRuleError("Serial tracking requires exactly one serial number per quantity unit")
            
            # Allow creating serial tracking even if item doesn't explicitly require it
            # (user provided serial numbers, so we should track them)
            
            serial_number = command.serial_numbers[0]
            
            # Additional validation for serial items that might have other requirements
            if item.requires_tracking_type("expiration"):
                # TODO: Implement combined tracking (Serial + Exp)
                # For now, we assume serial is the primary identifier
                pass
            
            # Get or create tracking (serial type)
            tracking = await self._tracking_repository.get_by_identifier(
                tenant_id=tenant_id,
                item_id=command.item_id,
                tracking_type="serial",
                identifier=serial_number
            )
            
            if not tracking:
                try:
                    tracking = InventoryTracking.create_serial(
                        tenant_id=tenant_id,
                        item_id=command.item_id,
                        serial_number=serial_number
                    )
                    tracking = await self._tracking_repository.save(tracking)
                except ConflictError:
                    # Look up again if created concurrently
                    tracking = await self._tracking_repository.get_by_identifier(
                        tenant_id=tenant_id,
                        item_id=command.item_id,
                        tracking_type="serial",
                        identifier=serial_number
                    )
                    if not tracking:
                        raise BusinessRuleError(f"Failed to create serial {serial_number}")
            tracking_id = tracking.id
            
        # 2. Supplier Batch Tracking
        # Create tracking if supplier_batch is provided, even if item doesn't explicitly require it
        elif command.supplier_batch:
            tracking = await self._tracking_repository.get_by_identifier(
                tenant_id=tenant_id,
                item_id=command.item_id,
                tracking_type="supplier_batch",
                identifier=command.supplier_batch
            )
            
            if not tracking:
                try:
                    tracking = InventoryTracking.create_supplier_batch(
                        tenant_id=tenant_id,
                        item_id=command.item_id,
                        supplier_batch=command.supplier_batch
                    )
                    tracking = await self._tracking_repository.save(tracking)
                except ConflictError:
                    tracking = await self._tracking_repository.get_by_identifier(
                        tenant_id=tenant_id,
                        item_id=command.item_id,
                        tracking_type="supplier_batch",
                        identifier=command.supplier_batch
                    )
            tracking_id = tracking.id

        # 3. Expiration Date Tracking (if not Supplier Batch)
        # Create tracking if expiration_date is provided, even if item doesn't explicitly require it
        elif command.expiration_date:
            # Identifier is generated from date: EXP-{date}
            identifier = f"EXP-{command.expiration_date.isoformat()}"
            
            tracking = await self._tracking_repository.get_by_identifier(
                tenant_id=tenant_id,
                item_id=command.item_id,
                tracking_type="expiration",
                identifier=identifier
            )
            
            if not tracking:
                try:
                    tracking = InventoryTracking.create_expiration(
                        tenant_id=tenant_id,
                        item_id=command.item_id,
                        expiration_date=command.expiration_date
                    )
                    tracking = await self._tracking_repository.save(tracking)
                except ConflictError:
                    tracking = await self._tracking_repository.get_by_identifier(
                        tenant_id=tenant_id,
                        item_id=command.item_id,
                        tracking_type="expiration",
                        identifier=identifier
                    )
            tracking_id = tracking.id

        # 5. Manufacturing Date Tracking (if not others)
        # Create tracking if manufacturing_date is provided, even if item doesn't explicitly require it
        elif command.manufacturing_date:
            # Identifier is generated from date: MFG-{date}
            identifier = f"MFG-{command.manufacturing_date.isoformat()}"
            
            tracking = await self._tracking_repository.get_by_identifier(
                tenant_id=tenant_id,
                item_id=command.item_id,
                tracking_type="manufacturing_date",
                identifier=identifier
            )
            
            if not tracking:
                try:
                    tracking = InventoryTracking.create_manufacturing_date(
                        tenant_id=tenant_id,
                        item_id=command.item_id,
                        manufacturing_date=command.manufacturing_date
                    )
                    tracking = await self._tracking_repository.save(tracking)
                except ConflictError:
                    tracking = await self._tracking_repository.get_by_identifier(
                        tenant_id=tenant_id,
                        item_id=command.item_id,
                        tracking_type="manufacturing_date",
                        identifier=identifier
                    )
            tracking_id = tracking.id

        # Check if tracking required but not provided
        if not tracking_id and item.tracking_scope != "none":
            # If item requires specific tracking and we didn't match any block above
            if item.requires_serial_tracking():
                raise ValidationError("Serial number is required for this item")
            if item.requires_tracking_type("supplier_batch"):
                raise ValidationError("Supplier batch is required for this item")
            if item.requires_tracking_type("expiration"):
                raise ValidationError("Expiration date is required for this item")
            if item.requires_tracking_type("manufacturing_date"):
                raise ValidationError("Manufacturing date is required for this item")
        
        # Use Unit of Work for atomic transaction
        async with unit_of_work() as uow:
            # Register repositories with Unit of Work
            uow.register_repository('balance', self._balance_repository)
            uow.register_repository('tracking', self._tracking_repository)
            uow.register_repository('transaction', self._transaction_repository)
            
            # Find or create balance
            balance = await self._balance_repository.find_balance(
                tenant_id=tenant_id,
                item_id=command.item_id,
                location_id=command.location_id,
                tracking_id=tracking_id,
                status="available"
            )
            
            if not balance:
                balance = InventoryBalance(
                    tenant_id=tenant_id,
                    item_id=command.item_id,
                    location_id=command.location_id,
                    tracking_id=tracking_id,
                    status="available",
                    quantity=Decimal('0')
                )
            
            # Generate transaction ID
            transaction_id = generate_id()
            
            # Receive into balance
            balance.receive(
                quantity=command.quantity,
                cost_per_unit=command.cost_per_unit,
                transaction_id=transaction_id
            )
            
            # Save balance
            balance = await self._balance_repository.save(balance)
            
            # Create transaction record
            await self._transaction_repository.save_transaction({
                "id": transaction_id,
                "type": "RECEIVE",
                "item_id": command.item_id,
                "quantity": command.quantity,
                "uom": item.default_uom,
                "location_id": command.location_id,
                "tracking_id": tracking_id,
                "cost_per_unit": command.cost_per_unit,
                "source_ref_type": command.source_ref_type,
                "source_ref_id": command.source_ref_id,
                "idempotency_key": command.idempotency_key
            })
            
            # Commit all changes atomically
            uow.commit()
            
            logger.info(
                f"Successfully received inventory: transaction={transaction_id}, "
                f"balance={balance.id}, final_quantity={balance.quantity}"
            )
            
            return {
                "transaction_id": transaction_id,
                "balance_id": balance.id,
                "quantity": balance.quantity
            }
    
    async def handle_issue_inventory(self, command: IssueInventoryCommand) -> dict:
        """Handle issue inventory command with Unit of Work for atomicity"""
        tenant_id = require_tenant_context()
        
        logger.info(
            f"Issuing inventory: item={command.item_id}, quantity={command.quantity}, "
            f"location={command.location_id}, tenant={tenant_id}"
        )
        
        # Validate command input
        if command.quantity <= 0:
            raise ValidationError("Quantity must be greater than zero")
        
        # Get item
        item = await self._item_repository.get_by_id(command.item_id)
        if not item:
            raise NotFoundError(f"Item with ID {command.item_id} not found")
        
        # Handle tracking if required (unified model)
        tracking_id = None
        if command.serial_numbers and len(command.serial_numbers) > 0:
            serial_number = command.serial_numbers[0]
            # Get tracking (serial type) - must exist for issue
            tracking = await self._tracking_repository.get_by_identifier(
                tenant_id=tenant_id,
                item_id=command.item_id,
                tracking_type="serial",
                identifier=serial_number
            )
            if not tracking:
                raise NotFoundError(f"Serial {serial_number} not found")
            tracking_id = tracking.id
        
        # Use Unit of Work for atomic transaction
        async with unit_of_work() as uow:
            # Register repositories with Unit of Work
            uow.register_repository('balance', self._balance_repository)
            uow.register_repository('transaction', self._transaction_repository)
            
            balance = await self._balance_repository.find_balance(
                tenant_id=tenant_id,
                item_id=command.item_id,
                location_id=command.location_id,
                tracking_id=tracking_id,
                status="available"
            )
            
            if not balance:
                raise BusinessRuleError("Insufficient inventory for issue operation")
            
            # Generate transaction ID
            transaction_id = generate_id()
            
            # Issue from balance
            balance.issue(
                quantity=command.quantity,
                transaction_id=transaction_id
            )
            
            # Save balance
            balance = await self._balance_repository.save(balance)
            
            # Create transaction record
            await self._transaction_repository.save_transaction({
                "id": transaction_id,
                "type": "ISSUE",
                "item_id": command.item_id,
                "quantity": command.quantity,
                "uom": item.default_uom,
                "location_id": command.location_id,
                "tracking_id": tracking_id,
                "source_ref_type": command.source_ref_type,
                "source_ref_id": command.source_ref_id,
                "reason_code": command.reason_code,
                "idempotency_key": command.idempotency_key
            })
            
            # Commit all changes atomically
            uow.commit()
            
            logger.info(
                f"Successfully issued inventory: transaction={transaction_id}, "
                f"balance={balance.id}, final_quantity={balance.quantity}"
            )
            
            return {
                "transaction_id": transaction_id,
                "balance_id": balance.id,
                "quantity": balance.quantity
            }
    
    async def handle_adjust_inventory(self, command: AdjustInventoryCommand) -> dict:
        """Handle adjust inventory command with Unit of Work for atomicity"""
        tenant_id = require_tenant_context()
        
        logger.info(
            f"Adjusting inventory: item={command.item_id}, quantity={command.quantity}, "
            f"type={command.adjustment_type}, location={command.location_id}, tenant={tenant_id}"
        )
        
        # Validate command input
        if command.quantity <= 0:
            raise ValidationError("Quantity must be greater than zero")
        
        if command.adjustment_type not in ["ADJUST_IN", "ADJUST_OUT"]:
            raise ValidationError(f"Invalid adjustment_type: {command.adjustment_type}")
        
        if not command.item_id or not command.item_id.strip():
            raise ValidationError("Item ID is required")
        
        if not command.location_id or not command.location_id.strip():
            raise ValidationError("Location ID is required")
        
        # Get item
        item = await self._item_repository.get_by_id(command.item_id)
        if not item:
            raise NotFoundError(f"Item with ID {command.item_id} not found")
        
        # Handle tracking if required (unified model)
        tracking_id = None
        
        # Use Unit of Work for atomic transaction
        async with unit_of_work() as uow:
            # Register repositories with Unit of Work
            uow.register_repository('balance', self._balance_repository)
            uow.register_repository('transaction', self._transaction_repository)
            
            balance = await self._balance_repository.find_balance(
                tenant_id=tenant_id,
                item_id=command.item_id,
                location_id=command.location_id,
                tracking_id=tracking_id,
                status="available"
            )
            
            if not balance:
                # Create balance for ADJUST_IN
                if command.adjustment_type == "ADJUST_IN":
                    balance = InventoryBalance(
                        tenant_id=tenant_id,
                        item_id=command.item_id,
                        location_id=command.location_id,
                        tracking_id=tracking_id,
                        status="available",
                        quantity=Decimal('0')
                    )
                else:
                    raise BusinessRuleError("Insufficient inventory for adjustment")
            
            # Generate transaction ID
            transaction_id = generate_id()
            
            # Adjust balance
            balance.adjust(
                quantity=command.quantity,
                adjustment_type=command.adjustment_type,
                transaction_id=transaction_id,
                reason_code=command.reason_code
            )
            
            # Save balance
            balance = await self._balance_repository.save(balance)
            
            # Create transaction record
            await self._transaction_repository.save_transaction({
                "id": transaction_id,
                "type": command.adjustment_type,
                "item_id": command.item_id,
                "quantity": command.quantity,
                "uom": item.default_uom,
                "location_id": command.location_id,
                "tracking_id": tracking_id,
                "reason_code": command.reason_code,
                "idempotency_key": command.idempotency_key
            })
            
            # Commit all changes atomically
            uow.commit()
            
            logger.info(
                f"Successfully adjusted inventory: transaction={transaction_id}, "
                f"balance={balance.id}, final_quantity={balance.quantity}, tenant={tenant_id}"
            )
            
            return {
                "transaction_id": transaction_id,
                "balance_id": balance.id,
                "quantity": balance.quantity
            }
    
    async def handle_move_inventory(self, command: MoveInventoryCommand) -> dict:
        """Handle move inventory command with Unit of Work for atomicity"""
        tenant_id = require_tenant_context()
        
        logger.info(
            f"Moving inventory: item={command.item_id}, quantity={command.quantity}, "
            f"from={command.from_location_id}, to={command.to_location_id}, tenant={tenant_id}"
        )
        
        # Validate command input
        if command.quantity <= 0:
            raise ValidationError("Quantity must be greater than zero")
        
        if command.from_location_id == command.to_location_id:
            raise ValidationError("Source and destination locations cannot be the same")
        
        if not command.item_id or not command.item_id.strip():
            raise ValidationError("Item ID is required")
        
        if not command.from_location_id or not command.from_location_id.strip():
            raise ValidationError("Source location ID is required")
        
        if not command.to_location_id or not command.to_location_id.strip():
            raise ValidationError("Destination location ID is required")
        
        # Get item
        item = await self._item_repository.get_by_id(command.item_id)
        if not item:
            raise NotFoundError(f"Item with ID {command.item_id} not found")
        
        # Handle tracking if required (unified model)
        tracking_id = None
        
        # Use Unit of Work for atomic transaction
        async with unit_of_work() as uow:
            # Register repositories with Unit of Work
            uow.register_repository('balance', self._balance_repository)
            uow.register_repository('transaction', self._transaction_repository)
            
            from_balance = await self._balance_repository.find_balance(
                tenant_id=tenant_id,
                item_id=command.item_id,
                location_id=command.from_location_id,
                tracking_id=tracking_id,
                status="available"
            )
            
            if not from_balance:
                raise BusinessRuleError("Insufficient inventory for move operation")
            
            # Find or create destination balance
            to_balance = await self._balance_repository.find_balance(
                tenant_id=tenant_id,
                item_id=command.item_id,
                location_id=command.to_location_id,
                tracking_id=tracking_id,
                status="available"
            )
            
            if not to_balance:
                to_balance = InventoryBalance(
                    tenant_id=tenant_id,
                    item_id=command.item_id,
                    location_id=command.to_location_id,
                    tracking_id=tracking_id,
                    status="available",
                    quantity=Decimal('0')
                )
            
            # Generate transaction ID
            transaction_id = generate_id()
            
            # Move from source
            from_balance.move(
                to_location_id=command.to_location_id,
                quantity=command.quantity,
                transaction_id=transaction_id
            )
            
            # Receive into destination
            to_balance.receive(
                quantity=command.quantity,
                cost_per_unit=Decimal('0'),  # No cost change on move
                transaction_id=transaction_id
            )
            
            # Save both balances
            from_balance = await self._balance_repository.save(from_balance)
            to_balance = await self._balance_repository.save(to_balance)
            
            # Create transaction record
            await self._transaction_repository.save_transaction({
                "id": transaction_id,
                "type": "MOVE",
                "item_id": command.item_id,
                "quantity": command.quantity,
                "uom": item.default_uom,
                "location_id": command.to_location_id,
                "tracking_id": tracking_id,
                "idempotency_key": command.idempotency_key
            })
            
            # Commit all changes atomically
            uow.commit()
            
            logger.info(
                f"Successfully moved inventory: transaction={transaction_id}, "
                f"from_balance={from_balance.id}, to_balance={to_balance.id}, "
                f"quantity={command.quantity}, tenant={tenant_id}"
            )
            
            return {
                "transaction_id": transaction_id,
                "from_balance_id": from_balance.id,
                "to_balance_id": to_balance.id,
                "quantity": command.quantity
            }
    
    async def handle_reserve_inventory(self, command: ReserveInventoryCommand) -> dict:
        """Handle reserve inventory command"""
        tenant_id = require_tenant_context()
        
        logger.info(
            f"Reserving inventory: item={command.item_id}, quantity={command.quantity}, "
            f"location={command.location_id}, tenant={tenant_id}"
        )
        
        # Validate input
        if not command.item_id or not command.item_id.strip():
            raise ValidationError("Item ID is required")
        
        if not command.location_id or not command.location_id.strip():
            raise ValidationError("Location ID is required")
        
        if command.quantity <= 0:
            raise ValidationError("Quantity must be greater than zero")
        
        if not command.source_type or not command.source_type.strip():
            raise ValidationError("Source type is required")
        
        if not command.source_id or not command.source_id.strip():
            raise ValidationError("Source ID is required")
        
        # Get available quantity
        available_qty = await self._balance_repository.get_available_quantity(
            tenant_id=tenant_id,
            item_id=command.item_id,
            location_id=command.location_id
        )
        
        if available_qty < command.quantity:
            raise BusinessRuleError(
                f"Insufficient available inventory. Available: {available_qty}, Requested: {command.quantity}",
                details={
                    "available_quantity": float(available_qty),
                    "requested_quantity": float(command.quantity),
                    "item_id": command.item_id,
                    "location_id": command.location_id
                }
            )
        
        # For now, create a simple reservation record
        # Full reservation implementation would require InventoryReservationRepository
        reservation_id = generate_id()
        
        # TODO: Implement full reservation logic with InventoryReservationRepository
        # This is a placeholder that validates availability
        
        logger.info(
            f"Successfully reserved inventory: reservation_id={reservation_id}, "
            f"item={command.item_id}, quantity={command.quantity}, tenant={tenant_id}"
        )
        
        return {
            "reservation_id": reservation_id,
            "item_id": command.item_id,
            "location_id": command.location_id,
            "quantity": command.quantity,
            "status": "reserved"
        }
    
    async def handle_release_reservation(self, command: ReleaseReservationCommand) -> bool:
        """Handle release reservation command"""
        # TODO: Implement full reservation release logic
        # This is a placeholder
        return True
    
    # Units of Measure Commands
    
    async def handle_create_unit_of_measure(self, command: CreateUnitOfMeasureCommand) -> dict:
        """Handle create unit of measure command"""
        tenant_id = require_tenant_context()
        
        logger.info(
            f"Creating unit of measure: code={command.code}, name={command.name}, "
            f"tenant={tenant_id}"
        )
        
        if not self._uom_repository:
            raise BusinessRuleError(
                "UOM repository not configured",
                details={"component": "UnitOfMeasureRepository"}
            )
        
        uom_data = {
            "code": command.code,
            "name": command.name,
            "base_uom": command.base_uom,
            "conversion_factor": command.conversion_factor,
        }
        
        result = await self._uom_repository.save(uom_data)
        
        logger.info(
            f"Successfully created unit of measure: code={command.code}, "
            f"uom_id={result.get('id') if isinstance(result, dict) else 'unknown'}, tenant={tenant_id}"
        )
        
        return result
    
    async def handle_update_unit_of_measure(self, command: UpdateUnitOfMeasureCommand) -> dict:
        """Handle update unit of measure command"""
        tenant_id = require_tenant_context()
        
        logger.info(
            f"Updating unit of measure: uom_id={command.uom_id}, tenant={tenant_id}"
        )
        
        if not self._uom_repository:
            raise BusinessRuleError(
                "UOM repository not configured",
                details={"component": "UnitOfMeasureRepository"}
            )
        
        # Get existing UOM
        existing = await self._uom_repository.get_by_id(command.uom_id)
        if not existing:
            raise NotFoundError(f"Unit of measure with ID {command.uom_id} not found")
        
        uom_data = {
            "id": command.uom_id,
            "code": command.code or existing["code"],
            "name": command.name or existing["name"],
            "base_uom": command.base_uom or existing["base_uom"],
            "conversion_factor": command.conversion_factor if command.conversion_factor is not None else existing["conversion_factor"],
        }
        
        result = await self._uom_repository.save(uom_data)
        
        logger.info(
            f"Successfully updated unit of measure: uom_id={command.uom_id}, tenant={tenant_id}"
        )
        
        return result
    
    async def handle_delete_unit_of_measure(self, command: DeleteUnitOfMeasureCommand) -> bool:
        """Handle delete unit of measure command"""
        tenant_id = require_tenant_context()
        
        logger.info(
            f"Deleting unit of measure: uom_id={command.uom_id}, tenant={tenant_id}"
        )
        
        if not self._uom_repository:
            raise BusinessRuleError(
                "UOM repository not configured",
                details={"component": "UnitOfMeasureRepository"}
            )
        
        result = await self._uom_repository.delete(command.uom_id)
        
        logger.info(
            f"Successfully deleted unit of measure: uom_id={command.uom_id}, tenant={tenant_id}"
        )
        
        return result
    
    # Category Commands
    
    async def handle_create_category(self, command: CreateCategoryCommand) -> ItemCategory:
        """Handle create category command"""
        tenant_id = require_tenant_context()
        
        if not self._category_repository:
            raise BusinessRuleError(
                "Category repository not configured",
                details={"component": "ItemCategoryRepository"}
            )
        
        # Check if code already exists
        existing = await self._category_repository.get_by_code(tenant_id, command.code)
        if existing:
            raise ConflictError(f"Category with code {command.code} already exists")
        
        # Validate parent if provided
        parent_level = 0
        if command.parent_category_id:
            parent = await self._category_repository.get_by_id(command.parent_category_id)
            if not parent:
                raise NotFoundError(f"Parent category with ID {command.parent_category_id} not found")
            if parent.tenant_id != tenant_id:
                raise NotFoundError(f"Parent category with ID {command.parent_category_id} not found")
            parent_level = parent.level
        
        # Create new category
        category = ItemCategory(
            tenant_id=tenant_id,
            code=command.code,
            name=command.name,
            description=command.description,
            parent_category_id=command.parent_category_id,
            level=parent_level + 1 if command.parent_category_id else 0,
            sort_order=command.sort_order,
            is_active=command.is_active,
            attributes=command.attributes or {}
        )
        
        return await self._category_repository.save(category)
    
    async def handle_update_category(self, command: UpdateCategoryCommand) -> ItemCategory:
        """Handle update category command"""
        tenant_id = require_tenant_context()
        
        if not self._category_repository:
            raise BusinessRuleError(
                "Category repository not configured",
                details={"component": "ItemCategoryRepository"}
            )
        
        category = await self._category_repository.get_by_id(command.category_id)
        if not category:
            raise NotFoundError(f"Category with ID {command.category_id} not found")
        
        if category.tenant_id != tenant_id:
            raise NotFoundError(f"Category with ID {command.category_id} not found")
        
        # Update fields if provided
        if command.code is not None and command.code != category.code:
            existing = await self._category_repository.get_by_code(tenant_id, command.code)
            # Check if code exists and belongs to a different category
            if existing and existing.id != category.id:
                raise ConflictError(f"Category with code {command.code} already exists")
            category.update_code(command.code)
        
        if command.name is not None:
            category.update_name(command.name)
        
        if command.description is not None:
            category.update_description(command.description)
        
        if command.sort_order is not None:
            category.update_sort_order(command.sort_order)
        
        if command.is_active is not None and command.is_active != category.is_active:
            if command.is_active:
                category.activate()
            else:
                category.deactivate()
        
        if command.parent_category_id is not None:
            # Validate parent if changing
            if command.parent_category_id != category.parent_category_id:
                if command.parent_category_id:
                    parent = await self._category_repository.get_by_id(command.parent_category_id)
                    if not parent:
                        raise NotFoundError(f"Parent category with ID {command.parent_category_id} not found")
                    if parent.tenant_id != tenant_id:
                        raise NotFoundError(f"Parent category with ID {command.parent_category_id} not found")
                    # Prevent circular reference
                    if command.parent_category_id == category.id:
                        raise BusinessRuleError("Category cannot be its own parent")
                    # Calculate new level based on parent's level
                    new_level = parent.level + 1
                    category.set_parent(command.parent_category_id, level=new_level)
                else:
                    # Setting to root (no parent)
                    category.set_parent(None)
        
        if command.attributes is not None:
            category.attributes = command.attributes
        
        return await self._category_repository.save(category)
    
    async def handle_delete_category(self, command: DeleteCategoryCommand) -> None:
        """Handle delete category command"""
        tenant_id = require_tenant_context()
        
        if not self._category_repository:
            raise BusinessRuleError(
                "Category repository not configured",
                details={"component": "ItemCategoryRepository"}
            )
        
        category = await self._category_repository.get_by_id(command.category_id)
        if not category:
            raise NotFoundError(f"Category with ID {command.category_id} not found")
        
        if category.tenant_id != tenant_id:
            raise NotFoundError(f"Category with ID {command.category_id} not found")
        
        # Check if category has children
        children = await self._category_repository.get_children(command.category_id)
        if children:
            raise BusinessRuleError("Cannot delete category with children. Delete or move children first.")
        
        # Check if category is used by items
        # TODO: Add check for items using this category
        
        await self._category_repository.delete(command.category_id)
    
class InventoryQueryHandler:
    """Handler for inventory queries"""
    
    def __init__(
        self,
        item_repository: ItemRepository,
        balance_repository: InventoryBalanceRepository,
        transaction_repository: InventoryTransactionRepository,
        uom_repository: Optional[UnitOfMeasureRepository] = None,
        category_repository: Optional[ItemCategoryRepository] = None,
    ):
        self._item_repository = item_repository
        self._balance_repository = balance_repository
        self._transaction_repository = transaction_repository
        self._uom_repository = uom_repository
        self._category_repository = category_repository
    
    # Item Queries
    
    async def handle_get_item_by_id(self, query: GetItemByIdQuery) -> Optional[Item]:
        """Handle get item by ID query"""
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        item = await self._item_repository.get_by_id(query.item_id)
        if item and item.tenant_id != tenant_id:
            return None  # Don't reveal existence of items from other tenants
        return item
    
    async def handle_get_item_by_sku(self, query: GetItemBySkuQuery) -> Optional[Item]:
        """Handle get item by SKU query"""
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        # Validate input
        if not query.sku or not query.sku.strip():
            raise ValidationError("SKU is required")
        
        return await self._item_repository.get_by_sku(tenant_id, query.sku.strip().upper())
    
    async def handle_get_all_items(self, query: GetAllItemsQuery) -> List[Item]:
        """Handle get all items query"""
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        return await self._item_repository.get_all(
            tenant_id=tenant_id,
            skip=query.skip,
            limit=query.limit,
            active_only=query.active_only
        )
    
    async def handle_get_items_by_ids(self, query: GetItemsByIdsQuery) -> List[Item]:
        """Handle get items by IDs query"""
        # Note: This implementation loops, which is N+1, but acceptable for small lists (goods receipt lines).
        # Future optimization: Add get_by_ids to repository interface.
        items = []
        for item_id in query.ids:
            item = await self._item_repository.get_by_id(item_id)
            if item:
                items.append(item)
        return items

    async def handle_search_items(self, query: SearchItemsQuery) -> List[Item]:
        """Handle search items query"""
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        # Validate input
        if not query.query or not query.query.strip():
            raise ValidationError("Search query is required")
        
        if query.skip < 0:
            raise ValidationError("Skip must be non-negative")
        
        if query.limit <= 0 or query.limit > 1000:
            raise ValidationError("Limit must be between 1 and 1000")
        
        return await self._item_repository.search(
            tenant_id=tenant_id,
            query=query.query.strip(),
            skip=query.skip,
            limit=query.limit,
            active_only=query.active_only
        )
    
    # Inventory Balance Queries
    
    async def handle_get_inventory_balance(self, query: GetInventoryBalanceQuery) -> Optional[InventoryBalance]:
        """Handle get inventory balance query"""
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        # Validate input
        if not query.item_id or not query.item_id.strip():
            raise ValidationError("Item ID is required")
        
        if not query.location_id or not query.location_id.strip():
            raise ValidationError("Location ID is required")
        
        return await self._balance_repository.find_balance(
            tenant_id=tenant_id,
            item_id=query.item_id,
            location_id=query.location_id,
            tracking_id=query.tracking_id,
            status=query.status
        )
    
    async def handle_get_available_quantity(self, query: GetAvailableQuantityQuery) -> Decimal:
        """Handle get available quantity query"""
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        # Validate input
        if not query.item_id or not query.item_id.strip():
            raise ValidationError("Item ID is required")
        
        if not query.location_id or not query.location_id.strip():
            raise ValidationError("Location ID is required")
        
        # Get balance at location
        balance = await self._balance_repository.find_balance(
            tenant_id=tenant_id,
            item_id=query.item_id,
            location_id=query.location_id
        )
        
        if balance:
            return balance.get_available_quantity()
        return Decimal('0')
    
    async def handle_get_balances_by_item(self, query: GetBalancesByItemQuery) -> List[InventoryBalance]:
        """Handle get balances by item query"""
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        return await self._balance_repository.get_balances_by_item(
            tenant_id=tenant_id,
            item_id=query.item_id,
            location_id=query.location_id,
            status=query.status
        )
    
    # Transaction Queries
    
    async def handle_get_transaction_history(self, query: GetTransactionHistoryQuery) -> List[Dict[str, Any]]:
        """Handle get transaction history query"""
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        return await self._transaction_repository.get_by_item(
            tenant_id=tenant_id,
            item_id=query.item_id,
            location_id=query.location_id,
            skip=query.skip,
            limit=query.limit
        )
    
    async def handle_get_transactions_by_reference(self, query: GetTransactionsByReferenceQuery) -> List[Dict[str, Any]]:
        """Handle get transactions by reference query"""
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        return await self._transaction_repository.get_by_reference(
            tenant_id=tenant_id,
            reference_type=query.reference_type,
            reference_id=query.reference_id
        )
    
    async def handle_get_transactions_by_date_range(self, query: GetTransactionsByDateRangeQuery) -> List[Dict[str, Any]]:
        """Handle get transactions by date range query"""
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        return await self._transaction_repository.get_by_date_range(
            tenant_id=tenant_id,
            start_date=query.start_date,
            end_date=query.end_date,
            location_id=query.location_id
        )
    
    # Units of Measure Queries
    
    async def handle_get_unit_of_measure_by_id(self, query: GetUnitOfMeasureByIdQuery) -> Optional[dict]:
        """Handle get unit of measure by ID query"""
        if not self._uom_repository:
            raise BusinessRuleError(
                "UOM repository not configured",
                details={"component": "UnitOfMeasureRepository"}
            )
        
        return await self._uom_repository.get_by_id(query.uom_id)
    
    async def handle_get_unit_of_measure_by_code(self, query: GetUnitOfMeasureByCodeQuery) -> Optional[dict]:
        """Handle get unit of measure by code query"""
        if not self._uom_repository:
            raise BusinessRuleError(
                "UOM repository not configured",
                details={"component": "UnitOfMeasureRepository"}
            )
        
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        return await self._uom_repository.get_by_code(tenant_id, query.code)
    
    async def handle_get_all_units_of_measure(self, query: GetAllUnitsOfMeasureQuery) -> List[dict]:
        """Handle get all units of measure query"""
        if not self._uom_repository:
            raise BusinessRuleError(
                "UOM repository not configured",
                details={"component": "UnitOfMeasureRepository"}
            )
        
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        return await self._uom_repository.get_all(
            tenant_id=tenant_id,
            skip=query.skip,
            limit=query.limit,
            base_uom=query.base_uom
        )
    
    async def handle_search_units_of_measure(self, query: SearchUnitsOfMeasureQuery) -> List[dict]:
        """Handle search units of measure query"""
        if not self._uom_repository:
            raise BusinessRuleError(
                "UOM repository not configured",
                details={"component": "UnitOfMeasureRepository"}
            )
        
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        return await self._uom_repository.search(
            tenant_id=tenant_id,
            query=query.query,
            skip=query.skip,
            limit=query.limit
        )
    
    # Category Queries
    
    async def handle_get_category_by_id(self, query: GetCategoryByIdQuery) -> Optional[ItemCategory]:
        """Handle get category by ID query"""
        if not self._category_repository:
            raise BusinessRuleError(
                "Category repository not configured",
                details={"component": "ItemCategoryRepository"}
            )
        
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        category = await self._category_repository.get_by_id(query.category_id)
        if category and category.tenant_id != tenant_id:
            return None
        return category
    
    async def handle_get_category_by_code(self, query: GetCategoryByCodeQuery) -> Optional[ItemCategory]:
        """Handle get category by code query"""
        if not self._category_repository:
            raise BusinessRuleError(
                "Category repository not configured",
                details={"component": "ItemCategoryRepository"}
            )
        
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        return await self._category_repository.get_by_code(tenant_id, query.code)
    
    async def handle_get_all_categories(self, query: GetAllCategoriesQuery) -> List[ItemCategory]:
        """Handle get all categories query"""
        if not self._category_repository:
            raise BusinessRuleError(
                "Category repository not configured",
                details={"component": "ItemCategoryRepository"}
            )
        
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        return await self._category_repository.get_all(
            tenant_id=tenant_id,
            parent_category_id=query.parent_category_id,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit
        )
    
    async def handle_get_category_tree(self, query: GetCategoryTreeQuery) -> List[Dict[str, Any]]:
        """Handle get category tree query"""
        if not self._category_repository:
            raise BusinessRuleError(
                "Category repository not configured",
                details={"component": "ItemCategoryRepository"}
            )
        
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        # Get root categories
        root_categories = await self._category_repository.get_root_categories(tenant_id)
        
        # Build tree recursively
        async def build_tree(category: ItemCategory) -> Dict[str, Any]:
            children = []
            # Get children for this category
            child_categories = await self._category_repository.get_children(category.id)
            for child in child_categories:
                children.append(await build_tree(child))
            
            return {
                "id": category.id,
                "tenant_id": category.tenant_id,
                "code": category.code,
                "name": category.name,
                "description": category.description,
                "parent_category_id": category.parent_category_id,
                "level": category.level,
                "sort_order": category.sort_order,
                "is_active": category.is_active,
                "attributes": category.attributes,
                "created_at": category.created_at.isoformat() if category.created_at else None,
                "updated_at": category.updated_at.isoformat() if category.updated_at else None,
                "children": children,
                "children_count": len(children),
                "has_children": len(children) > 0,
            }
        
        result = []
        for root in root_categories:
            result.append(await build_tree(root))
        
        return result
    
    async def handle_get_category_hierarchy(self, query: GetCategoryHierarchyQuery) -> Dict[str, Any]:
        """Handle get category hierarchy query"""
        if not self._category_repository:
            raise BusinessRuleError(
                "Category repository not configured",
                details={"component": "ItemCategoryRepository"}
            )
        
        from app.shared.tenant_context import require_tenant_context
        tenant_id = require_tenant_context()
        
        category = await self._category_repository.get_by_id(query.category_id)
        if not category:
            raise NotFoundError(f"Category with ID {query.category_id} not found")
        if category.tenant_id != tenant_id:
            raise NotFoundError(f"Category with ID {query.category_id} not found")
        
        ancestors = await self._category_repository.get_ancestors(query.category_id)
        descendants = await self._category_repository.get_descendants(query.category_id)
        
        return {
            "category": {
                "id": category.id,
                "tenant_id": category.tenant_id,
                "code": category.code,
                "name": category.name,
                "description": category.description,
                "parent_category_id": category.parent_category_id,
                "level": category.level,
                "sort_order": category.sort_order,
                "is_active": category.is_active,
                "attributes": category.attributes,
                "created_at": category.created_at.isoformat() if category.created_at else None,
                "updated_at": category.updated_at.isoformat() if category.updated_at else None,
            },
            "ancestors": [
                {
                    "id": a.id,
                    "code": a.code,
                    "name": a.name,
                    "level": a.level,
                }
                for a in ancestors
            ],
            "descendants": [
                {
                    "id": d.id,
                    "code": d.code,
                    "name": d.name,
                    "level": d.level,
                }
                for d in descendants
            ],
        }
    
    async def handle_get_category_children(self, query: GetCategoryChildrenQuery) -> List[ItemCategory]:
        """Handle get category children query"""
        if not self._category_repository:
            raise BusinessRuleError(
                "Category repository not configured",
                details={"component": "ItemCategoryRepository"}
            )
        
        return await self._category_repository.get_children(query.category_id)
