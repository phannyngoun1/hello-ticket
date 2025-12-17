"""
Migration: Add item_code and item_name to purchase_order_lines
Date: 2025-01-XX
Description: Add item_code and item_name columns to purchase_order_lines table for human-readable item references
"""

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('purchase_order_lines', sa.Column('item_code', sa.String(), nullable=True))
    op.add_column('purchase_order_lines', sa.Column('item_name', sa.String(), nullable=True))


def downgrade():
    op.drop_column('purchase_order_lines', 'item_name')
    op.drop_column('purchase_order_lines', 'item_code')

