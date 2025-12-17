#!/usr/bin/env python3
"""
Data migration script to populate store_locations from existing warehouses/zones/bins

This script migrates existing warehouse structure data to the new unified store_locations table.
It maintains backward compatibility by keeping the old tables intact.

Usage:
    python scripts/migrate_to_store_locations.py
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.infrastructure.shared.database.connection import get_session_sync, engine
from app.infrastructure.shared.database.models import (
    WarehouseModel, ZoneModel, BinModel, StoreLocationModel
)
from app.shared.enums import LocationTypeEnum
from datetime import datetime, timezone


def migrate_warehouses_to_store_locations(session: Session) -> dict:
    """Migrate warehouses to store_locations"""
    try:
        warehouses = session.exec(select(WarehouseModel)).all()
    except Exception as e:
        # Table doesn't exist or query failed - rollback and return
        session.rollback()
        print(f"  No warehouses table found or error: {e}")
        return {"warehouses": 0}
    
    migrated = 0
    
    for warehouse in warehouses:
        # Check if already migrated
        existing = session.exec(
            select(StoreLocationModel).where(
                StoreLocationModel.id == warehouse.id,
                StoreLocationModel.tenant_id == warehouse.tenant_id
            )
        ).first()
        
        if existing:
            print(f"  Warehouse {warehouse.code} already migrated, skipping")
            continue
        
        store_location = StoreLocationModel(
            id=warehouse.id,
            tenant_id=warehouse.tenant_id,
            location_type=LocationTypeEnum.WAREHOUSE,
            code=warehouse.code,
            name=warehouse.name,
            parent_location_id=None,
            address=warehouse.address,
            attributes={},
            created_at=warehouse.created_at,
            updated_at=warehouse.updated_at
        )
        
        session.add(store_location)
        migrated += 1
        print(f"  Migrated warehouse: {warehouse.code} -> location_id={warehouse.id}")
    
    return {"warehouses": migrated}


def migrate_zones_to_store_locations(session: Session) -> dict:
    """Migrate zones to store_locations"""
    try:
        zones = session.exec(select(ZoneModel)).all()
    except Exception as e:
        # Table doesn't exist or query failed - rollback and return
        session.rollback()
        print(f"  No zones table found or error: {e}")
        return {"zones": 0}
    
    migrated = 0
    
    for zone in zones:
        # Check if already migrated
        existing = session.exec(
            select(StoreLocationModel).where(
                StoreLocationModel.id == zone.id,
                StoreLocationModel.tenant_id == zone.tenant_id
            )
        ).first()
        
        if existing:
            print(f"  Zone {zone.code} already migrated, skipping")
            continue
        
        store_location = StoreLocationModel(
            id=zone.id,
            tenant_id=zone.tenant_id,
            location_type=LocationTypeEnum.ZONE,
            code=zone.code,
            name=zone.name,
            parent_location_id=zone.warehouse_id,  # Parent is warehouse
            attributes={},
            created_at=zone.created_at,
            updated_at=zone.updated_at
        )
        
        session.add(store_location)
        migrated += 1
        print(f"  Migrated zone: {zone.code} -> location_id={zone.id}, parent={zone.warehouse_id}")
    
    return {"zones": migrated}


def migrate_bins_to_store_locations(session: Session) -> dict:
    """Migrate bins to store_locations"""
    try:
        bins = session.exec(select(BinModel)).all()
    except Exception as e:
        # Table doesn't exist or query failed - rollback and return
        session.rollback()
        print(f"  No bins table found or error: {e}")
        return {"bins": 0}
    
    migrated = 0
    
    for bin in bins:
        # Check if already migrated
        existing = session.exec(
            select(StoreLocationModel).where(
                StoreLocationModel.id == bin.id,
                StoreLocationModel.tenant_id == bin.tenant_id
            )
        ).first()
        
        if existing:
            print(f"  Bin {bin.code} already migrated, skipping")
            continue
        
        # For bins, parent should be zone (if zone exists), otherwise warehouse
        # In current structure, bins have both warehouse_id and zone_id
        # We'll use zone_id as parent (more specific)
        parent_location_id = bin.zone_id if bin.zone_id else bin.warehouse_id
        
        store_location = StoreLocationModel(
            id=bin.id,
            tenant_id=bin.tenant_id,
            location_type=LocationTypeEnum.BIN,
            code=bin.code,
            name=None,  # Bins don't have names in current structure
            parent_location_id=parent_location_id,
            bin_type=bin.type,
            max_weight=bin.max_weight,
            max_volume=bin.max_volume,
            attributes={},
            created_at=bin.created_at,
            updated_at=bin.updated_at
        )
        
        session.add(store_location)
        migrated += 1
        print(f"  Migrated bin: {bin.code} -> location_id={bin.id}, parent={parent_location_id}")
    
    return {"bins": migrated}


def main():
    """Main migration function"""
    print("=" * 80)
    print("Store Locations Migration Script")
    print("=" * 80)
    print()
    print("This script migrates existing warehouse/zone/bin data to store_locations table.")
    print("Existing tables are kept intact for backward compatibility.")
    print()
    
    try:
        with get_session_sync() as session:
            print("Starting migration...")
            print()
            
            # Migrate warehouses first (they have no parents)
            print("1. Migrating warehouses...")
            warehouse_stats = migrate_warehouses_to_store_locations(session)
            print(f"   Migrated {warehouse_stats['warehouses']} warehouses")
            print()
            
            # Migrate zones (they depend on warehouses)
            print("2. Migrating zones...")
            zone_stats = migrate_zones_to_store_locations(session)
            print(f"   Migrated {zone_stats['zones']} zones")
            print()
            
            # Migrate bins (they depend on zones/warehouses)
            print("3. Migrating bins...")
            bin_stats = migrate_bins_to_store_locations(session)
            print(f"   Migrated {bin_stats['bins']} bins")
            print()
            
            # Commit all changes
            print("Committing changes...")
            session.commit()
            print("✓ Migration completed successfully!")
            print()
            
            # Summary
            total = (
                warehouse_stats['warehouses'] + 
                zone_stats['zones'] + 
                bin_stats['bins']
            )
            print("=" * 80)
            print("Migration Summary:")
            print(f"  Warehouses migrated: {warehouse_stats['warehouses']}")
            print(f"  Zones migrated: {zone_stats['zones']}")
            print(f"  Bins migrated: {bin_stats['bins']}")
            print(f"  Total locations: {total}")
            print("=" * 80)
            
    except Exception as e:
        print(f"ERROR: Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

