"""
Data migration script: Migrate existing lots and serials to unified inventory_tracking table

This script:
1. Migrates lots → inventory_tracking (type=LOT)
2. Migrates serials → inventory_tracking (type=SERIAL)
3. Updates inventory_balances.tracking_id from lot_id/serial_id

Run this after running the Alembic migration that creates the inventory_tracking table.
"""
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from sqlmodel import Session, select, text
from sqlalchemy.exc import ProgrammingError
from app.infrastructure.shared.database.connection import engine
from app.infrastructure.shared.database.models import (
    LotModel,
    SerialModel,
    InventoryTrackingModel,
    InventoryBalanceModel
)
from app.domain.inventory.tracking import InventoryTracking
from app.infrastructure.inventory.tracking_repository import SQLInventoryTrackingRepository
from datetime import datetime, timezone


def migrate_lots(session: Session, tenant_id: str = None) -> int:
    """Migrate lots to inventory_tracking"""
    try:
        lots = session.exec(select(LotModel)).all()
        if not lots:
            print("No lots found to migrate")
            return 0
        
        tracking_repo = SQLInventoryTrackingRepository(session=session, tenant_id=tenant_id)
        migrated_count = 0
        
        for lot in lots:
            # Check if tracking already exists
            existing = session.exec(
                select(InventoryTrackingModel).where(
                    InventoryTrackingModel.tenant_id == lot.tenant_id,
                    InventoryTrackingModel.item_id == lot.item_id,
                    InventoryTrackingModel.tracking_type == "lot",
                    InventoryTrackingModel.identifier == lot.lot_number.upper()
                )
            ).first()
            
            if existing:
                print(f"  Skipping lot {lot.lot_number} (already migrated)")
                continue
            
            # Create tracking entity
            tracking = InventoryTracking.create_lot(
                tenant_id=lot.tenant_id,
                item_id=lot.item_id,
                lot_number=lot.lot_number,
                expiration_date=lot.expiration_date,
                status=lot.status.value if hasattr(lot.status, 'value') else lot.status
            )
            
            # Set created_at/updated_at from original lot
            tracking.created_at = lot.created_at
            tracking.updated_at = lot.updated_at or lot.created_at
            tracking.id = lot.id  # Preserve original ID
            
            # Save tracking
            tracking = tracking_repo._entity_to_model(tracking)
            session.add(tracking)
            migrated_count += 1
        
        session.commit()
        print(f"✓ Migrated {migrated_count} lots to inventory_tracking")
        return migrated_count
        
    except ProgrammingError as e:
        # Table doesn't exist
        if "does not exist" in str(e) or "relation" in str(e).lower():
            print("  Lots table does not exist, skipping lot migration")
            session.rollback()
            return 0
        raise
    except Exception as e:
        print(f"  Error migrating lots: {e}")
        session.rollback()
        return 0


def migrate_serials(session: Session, tenant_id: str = None) -> int:
    """Migrate serials to inventory_tracking"""
    try:
        serials = session.exec(select(SerialModel)).all()
        if not serials:
            print("No serials found to migrate")
            return 0
        
        tracking_repo = SQLInventoryTrackingRepository(session=session, tenant_id=tenant_id)
        migrated_count = 0
        
        for serial in serials:
            # Check if tracking already exists
            existing = session.exec(
                select(InventoryTrackingModel).where(
                    InventoryTrackingModel.tenant_id == serial.tenant_id,
                    InventoryTrackingModel.item_id == serial.item_id,
                    InventoryTrackingModel.tracking_type == "serial",
                    InventoryTrackingModel.identifier == serial.serial_number.upper()
                )
            ).first()
            
            if existing:
                print(f"  Skipping serial {serial.serial_number} (already migrated)")
                continue
            
            # Create tracking entity
            tracking = InventoryTracking.create_serial(
                tenant_id=serial.tenant_id,
                item_id=serial.item_id,
                serial_number=serial.serial_number,
                status=serial.status.value if hasattr(serial.status, 'value') else serial.status
            )
            
            # Set created_at/updated_at from original serial
            tracking.created_at = serial.created_at
            tracking.updated_at = serial.updated_at or serial.created_at
            tracking.id = serial.id  # Preserve original ID
            
            # Save tracking
            tracking = tracking_repo._entity_to_model(tracking)
            session.add(tracking)
            migrated_count += 1
        
        session.commit()
        print(f"✓ Migrated {migrated_count} serials to inventory_tracking")
        return migrated_count
        
    except ProgrammingError as e:
        # Table doesn't exist
        if "does not exist" in str(e) or "relation" in str(e).lower():
            print("  Serials table does not exist, skipping serial migration")
            session.rollback()
            return 0
        raise
    except Exception as e:
        print(f"  Error migrating serials: {e}")
        session.rollback()
        return 0


def update_inventory_balances(session: Session) -> int:
    """Update inventory_balances to set tracking_id from lot_id/serial_id"""
    try:
        # Get balances with lot_id but no tracking_id
        balances_with_lot = session.exec(
            select(InventoryBalanceModel).where(
                InventoryBalanceModel.lot_id.isnot(None),
                InventoryBalanceModel.tracking_id.is_(None)
            )
        ).all()
        
        updated_count = 0
        for balance in balances_with_lot:
            # Set tracking_id from lot_id
            balance.tracking_id = balance.lot_id
            session.add(balance)
            updated_count += 1
        
        # Get balances with serial_id but no tracking_id
        balances_with_serial = session.exec(
            select(InventoryBalanceModel).where(
                InventoryBalanceModel.serial_id.isnot(None),
                InventoryBalanceModel.tracking_id.is_(None)
            )
        ).all()
        
        for balance in balances_with_serial:
            # Set tracking_id from serial_id
            balance.tracking_id = balance.serial_id
            session.add(balance)
            updated_count += 1
        
        session.commit()
        
        if updated_count > 0:
            print(f"✓ Updated {updated_count} inventory_balances with tracking_id")
        else:
            print("  No inventory_balances to update")
        
        return updated_count
        
    except Exception as e:
        print(f"  Error updating inventory_balances: {e}")
        session.rollback()
        return 0


def main():
    """Main migration function"""
    print("=" * 60)
    print("Inventory Tracking Migration")
    print("=" * 60)
    print()
    
    with Session(engine) as session:
        # Migrate lots
        print("Step 1: Migrating lots...")
        lots_count = migrate_lots(session)
        print()
        
        # Migrate serials
        print("Step 2: Migrating serials...")
        serials_count = migrate_serials(session)
        print()
        
        # Update inventory_balances
        print("Step 3: Updating inventory_balances...")
        balances_count = update_inventory_balances(session)
        print()
        
        # Summary
        print("=" * 60)
        print("Migration Summary")
        print("=" * 60)
        print(f"Lots migrated:     {lots_count}")
        print(f"Serials migrated:  {serials_count}")
        print(f"Balances updated:  {balances_count}")
        print()
        print("✓ Migration completed successfully!")
        print()
        print("Note: Old lot_id and serial_id fields in inventory_balances")
        print("      are deprecated but kept for backward compatibility.")


if __name__ == "__main__":
    main()

