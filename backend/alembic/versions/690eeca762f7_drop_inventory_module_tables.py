"""drop_inventory_module_tables

Revision ID: 690eeca762f7
Revises: fe28ff3e4942
Create Date: 2025-12-21 13:20:04.867757

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '690eeca762f7'
down_revision = 'fe28ff3e4942'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Drop all inventory module tables"""
    
    # Drop inventory costing tables
    op.execute("DROP TABLE IF EXISTS cost_variances CASCADE")
    op.execute("DROP TABLE IF EXISTS standard_costs CASCADE")
    op.execute("DROP TABLE IF EXISTS cost_layers CASCADE")
    
    # Drop inventory transaction tables
    op.execute("DROP TABLE IF EXISTS inventory_transactions CASCADE")
    
    # Drop inventory balance and reservation tables
    op.execute("DROP TABLE IF EXISTS inventory_reservations CASCADE")
    op.execute("DROP TABLE IF EXISTS inventory_balances CASCADE")
    
    # Drop inventory tracking tables
    op.execute("DROP TABLE IF EXISTS inventory_tracking CASCADE")
    op.execute("DROP TABLE IF EXISTS serials CASCADE")
    op.execute("DROP TABLE IF EXISTS lots CASCADE")
    
    # Drop item-related tables
    op.execute("DROP TABLE IF EXISTS item_uom_mappings CASCADE")
    op.execute("DROP TABLE IF EXISTS item_suppliers CASCADE")
    op.execute("DROP TABLE IF EXISTS barcodes CASCADE")
    op.execute("DROP TABLE IF EXISTS units_of_measure CASCADE")
    op.execute("DROP TABLE IF EXISTS items CASCADE")
    op.execute("DROP TABLE IF EXISTS item_categories CASCADE")
    
    print("✓ Successfully dropped all inventory module tables")


def downgrade() -> None:
    """
    Downgrade not supported for this migration.
    This is a destructive operation - inventory tables and data cannot be recovered.
    If you need to restore inventory functionality, you would need to:
    1. Restore the inventory module code
    2. Create new tables from scratch
    3. Re-import any data from backups
    """
    raise NotImplementedError(
        "Cannot downgrade: Inventory module has been permanently removed. "
        "Data cannot be restored through migration rollback."
    )

