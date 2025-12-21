"""drop_warehouse_purchasing_related_tables

Revision ID: 9f3c74a776e8
Revises: 690eeca762f7
Create Date: 2025-12-21 13:26:59.051215

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9f3c74a776e8'
down_revision = '690eeca762f7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Drop warehouse, purchasing, and logistics related tables"""
    
    # Drop warehouse/logistics tables
    op.execute("DROP TABLE IF EXISTS vehicles CASCADE")
    op.execute("DROP TABLE IF EXISTS employees CASCADE")
    
    # Drop putaway/picking tables
    op.execute("DROP TABLE IF EXISTS putaway_locations CASCADE")
    op.execute("DROP TABLE IF EXISTS putaway_rules CASCADE")
    op.execute("DROP TABLE IF EXISTS picking_rules CASCADE")
    
    # Drop purchasing tables
    op.execute("DROP TABLE IF EXISTS goods_receipt_lines CASCADE")
    op.execute("DROP TABLE IF EXISTS goods_receipts CASCADE")
    op.execute("DROP TABLE IF EXISTS purchase_order_lines CASCADE")
    op.execute("DROP TABLE IF EXISTS purchase_orders CASCADE")
    op.execute("DROP TABLE IF EXISTS vendors CASCADE")
    
    # Drop address tables (used by vendors and other entities)
    op.execute("DROP TABLE IF EXISTS address_assignments CASCADE")
    op.execute("DROP TABLE IF EXISTS addresses CASCADE")
    
    # Drop store locations (warehouse structure)
    op.execute("DROP TABLE IF EXISTS store_locations CASCADE")
    
    print("✓ Successfully dropped all warehouse, purchasing, and logistics tables")


def downgrade() -> None:
    """
    Downgrade not supported for this migration.
    This is a destructive operation - warehouse, purchasing, and logistics data cannot be recovered.
    """
    raise NotImplementedError(
        "Cannot downgrade: Warehouse/Purchasing modules have been permanently removed. "
        "Data cannot be restored through migration rollback."
    )

