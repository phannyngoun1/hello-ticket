#!/usr/bin/env python3
"""
Create test data for inventory tracking system

This script creates:
- Test tenant
- Test items (with lot/serial tracking)
- Test store locations (warehouse, zones, bins)
- Test inventory tracking (lots, serials, expiration)
- Test inventory balances
"""
import sys
import os
from pathlib import Path
from datetime import date, datetime, timezone, timedelta

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from sqlmodel import Session, select
from decimal import Decimal
from app.infrastructure.shared.database.connection import engine
from app.infrastructure.shared.database.models import (
    ItemModel,
    StoreLocationModel,
    InventoryTrackingModel,
    InventoryBalanceModel,
    InventoryTransactionModel
)
from app.shared.enums import LocationTypeEnum, TrackingTypeEnum
from app.shared.utils import generate_id


def create_test_tenant(session: Session) -> str:
    """Create or get test tenant"""
    tenant_id = "test-tenant-001"
    print(f"Using test tenant: {tenant_id}")
    return tenant_id


def create_test_items(session: Session, tenant_id: str) -> dict:
    """Create test items"""
    print("\nCreating test items...")
    
    items = {}
    
    # Item 1: Lot tracked item
    item1 = ItemModel(
        tenant_id=tenant_id,
        sku="ITEM-LOT-001",
        name="Lot Tracked Product",
        description="Product that requires lot tracking",
        default_uom="EA",
        track_serial=False,
        track_lot=True,
        perishable=True,
        active=True
    )
    session.add(item1)
    session.flush()
    items["lot_item"] = item1
    print(f"  ✓ Created lot-tracked item: {item1.sku} (ID: {item1.id})")
    
    # Item 2: Serial tracked item
    item2 = ItemModel(
        tenant_id=tenant_id,
        sku="ITEM-SERIAL-001",
        name="Serial Tracked Product",
        description="Product that requires serial tracking",
        default_uom="EA",
        track_serial=True,
        track_lot=False,
        perishable=False,
        active=True
    )
    session.add(item2)
    session.flush()
    items["serial_item"] = item2
    print(f"  ✓ Created serial-tracked item: {item2.sku} (ID: {item2.id})")
    
    # Item 3: Both lot and serial tracked
    item3 = ItemModel(
        tenant_id=tenant_id,
        sku="ITEM-BOTH-001",
        name="Both Tracked Product",
        description="Product that requires both lot and serial tracking",
        default_uom="EA",
        track_serial=True,
        track_lot=True,
        perishable=True,
        active=True
    )
    session.add(item3)
    session.flush()
    items["both_item"] = item3
    print(f"  ✓ Created both-tracked item: {item3.sku} (ID: {item3.id})")
    
    # Item 4: No tracking
    item4 = ItemModel(
        tenant_id=tenant_id,
        sku="ITEM-NONE-001",
        name="No Tracking Product",
        description="Product with no tracking requirements",
        default_uom="EA",
        track_serial=False,
        track_lot=False,
        perishable=False,
        active=True
    )
    session.add(item4)
    session.flush()
    items["no_tracking_item"] = item4
    print(f"  ✓ Created no-tracking item: {item4.sku} (ID: {item4.id})")
    
    return items


def create_test_locations(session: Session, tenant_id: str) -> dict:
    """Create test store locations"""
    print("\nCreating test store locations...")
    
    locations = {}
    
    # Warehouse
    warehouse = StoreLocationModel(
        tenant_id=tenant_id,
        location_type=LocationTypeEnum.WAREHOUSE,
        code="WH-001",
        name="Main Warehouse",
        parent_location_id=None,
        address={
            "street": "123 Warehouse St",
            "city": "San Francisco",
            "state": "CA",
            "zip": "94102",
            "country": "USA"
        }
    )
    session.add(warehouse)
    session.flush()
    locations["warehouse"] = warehouse
    print(f"  ✓ Created warehouse: {warehouse.code} (ID: {warehouse.id})")
    
    # Zone
    zone = StoreLocationModel(
        tenant_id=tenant_id,
        location_type=LocationTypeEnum.ZONE,
        code="ZONE-A",
        name="Zone A - Fast Moving",
        parent_location_id=warehouse.id
    )
    session.add(zone)
    session.flush()
    locations["zone"] = zone
    print(f"  ✓ Created zone: {zone.code} (ID: {zone.id})")
    
    # Bins
    bin1 = StoreLocationModel(
        tenant_id=tenant_id,
        location_type=LocationTypeEnum.BIN,
        code="BIN-A-001",
        name="Bin A-001",
        parent_location_id=zone.id,
        bin_type="PICK_FACE",
        max_weight=Decimal("1000.00"),
        max_volume=Decimal("5.00")
    )
    session.add(bin1)
    session.flush()
    locations["bin1"] = bin1
    print(f"  ✓ Created bin: {bin1.code} (ID: {bin1.id})")
    
    bin2 = StoreLocationModel(
        tenant_id=tenant_id,
        location_type=LocationTypeEnum.BIN,
        code="BIN-A-002",
        name="Bin A-002",
        parent_location_id=zone.id,
        bin_type="BULK",
        max_weight=Decimal("2000.00"),
        max_volume=Decimal("10.00")
    )
    session.add(bin2)
    session.flush()
    locations["bin2"] = bin2
    print(f"  ✓ Created bin: {bin2.code} (ID: {bin2.id})")
    
    return locations


def create_test_tracking(session: Session, tenant_id: str, items: dict) -> dict:
    """Create test inventory tracking"""
    print("\nCreating test inventory tracking...")
    
    trackings = {}
    
    # Lot tracking for lot_item
    lot1 = InventoryTrackingModel(
        tenant_id=tenant_id,
        item_id=items["lot_item"].id,
        tracking_type=TrackingTypeEnum.LOT,
        identifier="LOT-2025-001",
        expiration_date=date.today() + timedelta(days=90),
        status="available"
    )
    session.add(lot1)
    session.flush()
    trackings["lot1"] = lot1
    print(f"  ✓ Created lot: {lot1.identifier} (ID: {lot1.id}, expires: {lot1.expiration_date})")
    
    lot2 = InventoryTrackingModel(
        tenant_id=tenant_id,
        item_id=items["lot_item"].id,
        tracking_type=TrackingTypeEnum.LOT,
        identifier="LOT-2025-002",
        expiration_date=date.today() + timedelta(days=30),
        status="available"
    )
    session.add(lot2)
    session.flush()
    trackings["lot2"] = lot2
    print(f"  ✓ Created lot: {lot2.identifier} (ID: {lot2.id}, expires: {lot2.expiration_date})")
    
    # Expired lot
    lot_expired = InventoryTrackingModel(
        tenant_id=tenant_id,
        item_id=items["lot_item"].id,
        tracking_type=TrackingTypeEnum.LOT,
        identifier="LOT-2024-EXPIRED",
        expiration_date=date.today() - timedelta(days=10),
        status="expired"
    )
    session.add(lot_expired)
    session.flush()
    trackings["lot_expired"] = lot_expired
    print(f"  ✓ Created expired lot: {lot_expired.identifier} (ID: {lot_expired.id})")
    
    # Serial tracking for serial_item
    serial1 = InventoryTrackingModel(
        tenant_id=tenant_id,
        item_id=items["serial_item"].id,
        tracking_type=TrackingTypeEnum.SERIAL,
        identifier="SN-001-2025",
        status="available"
    )
    session.add(serial1)
    session.flush()
    trackings["serial1"] = serial1
    print(f"  ✓ Created serial: {serial1.identifier} (ID: {serial1.id})")
    
    serial2 = InventoryTrackingModel(
        tenant_id=tenant_id,
        item_id=items["serial_item"].id,
        tracking_type=TrackingTypeEnum.SERIAL,
        identifier="SN-002-2025",
        status="available"
    )
    session.add(serial2)
    session.flush()
    trackings["serial2"] = serial2
    print(f"  ✓ Created serial: {serial2.identifier} (ID: {serial2.id})")
    
    # Serial with expiration (combination)
    serial3 = InventoryTrackingModel(
        tenant_id=tenant_id,
        item_id=items["serial_item"].id,
        tracking_type=TrackingTypeEnum.SERIAL,
        identifier="SN-003-2025",
        status="available"
    )
    session.add(serial3)
    session.flush()
    
    expiration = InventoryTrackingModel(
        tenant_id=tenant_id,
        item_id=items["serial_item"].id,
        tracking_type=TrackingTypeEnum.EXPIRATION,
        identifier=f"EXP-{(date.today() + timedelta(days=60)).isoformat()}",
        expiration_date=date.today() + timedelta(days=60),
        parent_tracking_id=serial3.id,
        status="available"
    )
    session.add(expiration)
    session.flush()
    trackings["serial3_with_expiry"] = serial3
    trackings["expiration1"] = expiration
    print(f"  ✓ Created serial with expiration: {serial3.identifier} + expiration (ID: {expiration.id})")
    
    # Lot with manufacturing date (combination)
    lot3 = InventoryTrackingModel(
        tenant_id=tenant_id,
        item_id=items["both_item"].id,
        tracking_type=TrackingTypeEnum.LOT,
        identifier="LOT-BOTH-001",
        expiration_date=date.today() + timedelta(days=120),
        status="available"
    )
    session.add(lot3)
    session.flush()
    
    manufacturing = InventoryTrackingModel(
        tenant_id=tenant_id,
        item_id=items["both_item"].id,
        tracking_type=TrackingTypeEnum.MANUFACTURING_DATE,
        identifier=f"MFG-{(date.today() - timedelta(days=30)).isoformat()}",
        manufacturing_date=date.today() - timedelta(days=30),
        parent_tracking_id=lot3.id,
        status="available"
    )
    session.add(manufacturing)
    session.flush()
    trackings["lot3_with_mfg"] = lot3
    trackings["manufacturing1"] = manufacturing
    print(f"  ✓ Created lot with manufacturing date: {lot3.identifier} + mfg date (ID: {manufacturing.id})")
    
    return trackings


def create_test_balances(session: Session, tenant_id: str, items: dict, locations: dict, trackings: dict):
    """Create test inventory balances"""
    print("\nCreating test inventory balances...")
    
    # Check if table exists first
    from sqlalchemy import inspect, text
    inspector = inspect(session.bind)
    table_exists = "inventory_balances" in inspector.get_table_names()
    
    if not table_exists:
        print("  ⚠ inventory_balances table does not exist, skipping balance creation")
        return []
    
    balances = []
    
    # Balance 1: Lot tracked item in bin1
    balance1 = InventoryBalanceModel(
        tenant_id=tenant_id,
        item_id=items["lot_item"].id,
        location_id=locations["bin1"].id,
        tracking_id=trackings["lot1"].id,
        status="available",
        quantity=Decimal("100.00"),
        version=0
    )
    session.add(balance1)
    session.flush()
    balances.append(balance1)
    print(f"  ✓ Created balance: {items['lot_item'].sku} @ {locations['bin1'].code} (lot: {trackings['lot1'].identifier}) = {balance1.quantity}")
    
    # Balance 2: Same lot in bin2
    balance2 = InventoryBalanceModel(
        tenant_id=tenant_id,
        item_id=items["lot_item"].id,
        location_id=locations["bin2"].id,
        tracking_id=trackings["lot1"].id,
        status="available",
        quantity=Decimal("50.00"),
        version=0
    )
    session.add(balance2)
    session.flush()
    balances.append(balance2)
    print(f"  ✓ Created balance: {items['lot_item'].sku} @ {locations['bin2'].code} (lot: {trackings['lot1'].identifier}) = {balance2.quantity}")
    
    # Balance 3: Different lot in bin1
    balance3 = InventoryBalanceModel(
        tenant_id=tenant_id,
        item_id=items["lot_item"].id,
        location_id=locations["bin1"].id,
        tracking_id=trackings["lot2"].id,
        status="available",
        quantity=Decimal("75.00"),
        version=0
    )
    session.add(balance3)
    session.flush()
    balances.append(balance3)
    print(f"  ✓ Created balance: {items['lot_item'].sku} @ {locations['bin1'].code} (lot: {trackings['lot2'].identifier}) = {balance3.quantity}")
    
    # Balance 4: Serial tracked item
    balance4 = InventoryBalanceModel(
        tenant_id=tenant_id,
        item_id=items["serial_item"].id,
        location_id=locations["bin1"].id,
        tracking_id=trackings["serial1"].id,
        status="available",
        quantity=Decimal("1.00"),
        version=0
    )
    session.add(balance4)
    session.flush()
    balances.append(balance4)
    print(f"  ✓ Created balance: {items['serial_item'].sku} @ {locations['bin1'].code} (serial: {trackings['serial1'].identifier}) = {balance4.quantity}")
    
    # Balance 5: Serial with expiration
    balance5 = InventoryBalanceModel(
        tenant_id=tenant_id,
        item_id=items["serial_item"].id,
        location_id=locations["bin2"].id,
        tracking_id=trackings["serial3_with_expiry"].id,
        status="available",
        quantity=Decimal("1.00"),
        version=0
    )
    session.add(balance5)
    session.flush()
    balances.append(balance5)
    print(f"  ✓ Created balance: {items['serial_item'].sku} @ {locations['bin2'].code} (serial with expiry: {trackings['serial3_with_expiry'].identifier}) = {balance5.quantity}")
    
    # Balance 6: No tracking
    balance6 = InventoryBalanceModel(
        tenant_id=tenant_id,
        item_id=items["no_tracking_item"].id,
        location_id=locations["bin1"].id,
        tracking_id=None,
        status="available",
        quantity=Decimal("500.00"),
        version=0
    )
    session.add(balance6)
    session.flush()
    balances.append(balance6)
    print(f"  ✓ Created balance: {items['no_tracking_item'].sku} @ {locations['bin1'].code} (no tracking) = {balance6.quantity}")
    
    # Balance 7: Expired lot (on hold)
    balance7 = InventoryBalanceModel(
        tenant_id=tenant_id,
        item_id=items["lot_item"].id,
        location_id=locations["bin2"].id,
        tracking_id=trackings["lot_expired"].id,
        status="hold",
        quantity=Decimal("25.00"),
        version=0
    )
    session.add(balance7)
    session.flush()
    balances.append(balance7)
    print(f"  ✓ Created balance: {items['lot_item'].sku} @ {locations['bin2'].code} (expired lot) = {balance7.quantity} [HOLD]")
    
    return balances


def main():
    """Main function to create test data"""
    print("=" * 60)
    print("Creating Inventory Tracking Test Data")
    print("=" * 60)
    
    with Session(engine) as session:
        try:
            # Create test tenant
            tenant_id = create_test_tenant(session)
            
            # Create test items
            items = create_test_items(session, tenant_id)
            
            # Create test locations
            locations = create_test_locations(session, tenant_id)
            
            # Create test tracking
            trackings = create_test_tracking(session, tenant_id, items)
            
            # Create test balances (skip if table doesn't exist)
            balances = create_test_balances(session, tenant_id, items, locations, trackings)
            
            session.commit()
            
            print("\n" + "=" * 60)
            print("Test Data Summary")
            print("=" * 60)
            print(f"Tenant:           {tenant_id}")
            print(f"Items created:    {len(items)}")
            print(f"Locations:        {len(locations)}")
            print(f"Tracking entries: {len(trackings)}")
            print(f"Balances:         {len(balances) if balances else 'N/A (table not created)'}")
            print("\n✓ Test data created successfully!")
            print("\nYou can now test:")
            print("  - Querying tracking entries")
            print("  - Finding expired items")
            print("  - Tracking combinations (lot + expiry, serial + expiry)")
            print("  - Inventory operations with tracking")
            print("\nNote: If inventory_balances table exists, balances will be created.")
            
        except Exception as e:
            session.rollback()
            print(f"\n✗ Error creating test data: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    main()

