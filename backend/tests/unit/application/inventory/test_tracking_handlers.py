import pytest
from datetime import date, datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

from app.application.inventory.handlers import InventoryCommandHandler
from app.application.inventory.commands import ReceiveInventoryCommand
from app.domain.inventory.item import Item
from app.domain.inventory.tracking import InventoryTracking
from app.shared.enums import TrackingTypeEnum
from app.shared.exceptions import ValidationError, BusinessRuleError

@pytest.fixture
def mock_repositories():
    return {
        "item_repository": AsyncMock(),
        "balance_repository": AsyncMock(),
        "lot_repository": AsyncMock(),
        "serial_repository": AsyncMock(),
        "tracking_repository": AsyncMock(),
        "transaction_repository": AsyncMock(),
    }

@pytest.fixture
def handler(mock_repositories):
    return InventoryCommandHandler(**mock_repositories)

@pytest.fixture
def base_item():
    item = MagicMock(spec=Item)
    item.tenant_id = "tenant-1"
    item.default_uom = "PCS"
    item.tracking_scope = "inventory_only"
    # Default mocks
    item.requires_tracking_type.return_value = False
    item.requires_lot_tracking.return_value = False
    item.requires_serial_tracking.return_value = False
    return item

@pytest.mark.asyncio
async def test_receive_expiration_tracking(handler, mock_repositories, base_item):
    # Setup item requiring expiration
    base_item.requires_tracking_type.side_effect = lambda t: t == "expiration"
    mock_repositories["item_repository"].get_by_id.return_value = base_item
    
    # Setup tracking repo to return None first (not found) then saved tracking
    mock_repositories["tracking_repository"].get_by_identifier.return_value = None
    saved_tracking = MagicMock(spec=InventoryTracking)
    saved_tracking.id = "track-exp-1"
    mock_repositories["tracking_repository"].save.return_value = saved_tracking

    # Command with expiration date
    command = ReceiveInventoryCommand(
        item_id="item-1",
        location_id="loc-1",
        quantity=Decimal("10"),
        cost_per_unit=Decimal("5"),
        expiration_date=date(2025, 12, 31)
    )

    # Patch tenant context and unit of work
    with patch("app.application.inventory.handlers.require_tenant_context", return_value="tenant-1"), \
         patch("app.application.inventory.handlers.unit_of_work") as mock_uow:
        
        mock_uow.return_value.__aenter__.return_value = AsyncMock()
        
        result = await handler.handle_receive_inventory(command)

    # Verify tracking creation was attempted
    mock_repositories["tracking_repository"].save.assert_called_once()
    args = mock_repositories["tracking_repository"].save.call_args[0]
    tracking = args[0]
    assert tracking.tracking_type == "expiration"
    assert tracking.expiration_date == date(2025, 12, 31)

@pytest.mark.asyncio
async def test_receive_expiration_missing_date_fails(handler, mock_repositories, base_item):
    # Setup item requiring expiration
    base_item.requires_tracking_type.side_effect = lambda t: t == "expiration"
    mock_repositories["item_repository"].get_by_id.return_value = base_item

    command = ReceiveInventoryCommand(
        item_id="item-1",
        location_id="loc-1",
        quantity=Decimal("10"),
        cost_per_unit=Decimal("5")
        # Missing expiration_date
    )

    with patch("app.application.inventory.handlers.require_tenant_context", return_value="tenant-1"):
        with pytest.raises(ValidationError, match="Expiration date is required"):
            await handler.handle_receive_inventory(command)

@pytest.mark.asyncio
async def test_receive_manufacturing_date_tracking(handler, mock_repositories, base_item):
    # Setup item requiring mfg date
    base_item.requires_tracking_type.side_effect = lambda t: t == "manufacturing_date"
    mock_repositories["item_repository"].get_by_id.return_value = base_item
    
    # Setup tracking repo
    mock_repositories["tracking_repository"].get_by_identifier.return_value = None
    saved_tracking = MagicMock(spec=InventoryTracking)
    saved_tracking.id = "track-mfg-1"
    mock_repositories["tracking_repository"].save.return_value = saved_tracking

    command = ReceiveInventoryCommand(
        item_id="item-1",
        location_id="loc-1",
        quantity=Decimal("10"),
        cost_per_unit=Decimal("5"),
        manufacturing_date=date(2025, 1, 1)
    )

    with patch("app.application.inventory.handlers.require_tenant_context", return_value="tenant-1"), \
         patch("app.application.inventory.handlers.unit_of_work") as mock_uow:
        
        mock_uow.return_value.__aenter__.return_value = AsyncMock()
        await handler.handle_receive_inventory(command)

    mock_repositories["tracking_repository"].save.assert_called_once()
    args = mock_repositories["tracking_repository"].save.call_args[0]
    tracking = args[0]
    assert tracking.tracking_type == "manufacturing_date"
    assert tracking.manufacturing_date == date(2025, 1, 1)

@pytest.mark.asyncio
async def test_receive_supplier_batch_tracking(handler, mock_repositories, base_item):
    # Setup item requiring supplier batch
    base_item.requires_tracking_type.side_effect = lambda t: t == "supplier_batch"
    mock_repositories["item_repository"].get_by_id.return_value = base_item
    
    # Setup tracking repo
    mock_repositories["tracking_repository"].get_by_identifier.return_value = None
    saved_tracking = MagicMock(spec=InventoryTracking)
    saved_tracking.id = "track-batch-1"
    mock_repositories["tracking_repository"].save.return_value = saved_tracking

    command = ReceiveInventoryCommand(
        item_id="item-1",
        location_id="loc-1",
        quantity=Decimal("10"),
        cost_per_unit=Decimal("5"),
        supplier_batch="BATCH-001"
    )

    with patch("app.application.inventory.handlers.require_tenant_context", return_value="tenant-1"), \
         patch("app.application.inventory.handlers.unit_of_work") as mock_uow:
        
        mock_uow.return_value.__aenter__.return_value = AsyncMock()
        await handler.handle_receive_inventory(command)

    mock_repositories["tracking_repository"].save.assert_called_once()
    args = mock_repositories["tracking_repository"].save.call_args[0]
    tracking = args[0]
    assert tracking.tracking_type == "supplier_batch"
    assert tracking.supplier_batch == "BATCH-001"
