"""drop_orphaned_tables_without_models

Revision ID: b427d8a828cb
Revises: 981514254019
Create Date: 2025-12-20 16:55:21.835594

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'b427d8a828cb'
down_revision = '981514254019'
branch_labels = None
depends_on = None

# Tables that should exist (from models)
VALID_TABLES = {
    # Platform tables
    'tenants', 'tenant_subscriptions', 'users', 'sessions', 'groups', 
    'user_groups', 'roles', 'user_roles', 'group_roles', 'user_preferences',
    # Operational tables
    'addresses', 'address_assignments', 'audit_logs', 'barcodes', 'cost_layers',
    'cost_variances', 'customer_groups', 'customer_types', 'employees',
    'event_types', 'goods_receipt_lines', 'goods_receipts', 'inventory_balances',
    'inventory_reservations', 'inventory_tracking', 'inventory_transactions',
    'item_categories', 'item_suppliers', 'item_uom_mappings', 'items', 'layouts',
    'lots', 'organizers', 'picking_rules', 'purchase_order_lines', 'purchase_orders',
    'putaway_locations', 'putaway_rules', 'seats', 'sequences', 'serials',
    'standard_costs', 'store_locations', 'test_basics', 'test_entities',
    'test_tree_backends', 'test_trees', 'tests', 'ui_custom_components',
    'ui_pages', 'ui_schema_versions', 'ui_schemas', 'units_of_measure',
    'users_cache', 'vehicles', 'vendors', 'venues',
    # Alembic managed
    'alembic_version',
}


def upgrade() -> None:
    """Drop tables that don't have corresponding models"""
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Get all tables in the database
    all_tables = set(inspector.get_table_names())
    
    # Find orphaned tables (tables that exist but don't have models)
    orphaned_tables = all_tables - VALID_TABLES
    
    if not orphaned_tables:
        print("No orphaned tables found. All tables have corresponding models.")
        return
    
    print(f"Found {len(orphaned_tables)} orphaned table(s) to drop: {sorted(orphaned_tables)}")
    
    # Drop orphaned tables
    for table_name in sorted(orphaned_tables):
        try:
            # Check if table exists before dropping
            if table_name in inspector.get_table_names():
                print(f"Dropping table: {table_name}")
                op.drop_table(table_name)
        except Exception as e:
            print(f"Warning: Could not drop table {table_name}: {e}")
            # Continue with other tables


def downgrade() -> None:
    """Cannot restore dropped tables without knowing their structure"""
    # This migration is one-way - we cannot restore orphaned tables
    # as we don't know their structure
    pass

