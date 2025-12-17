"""
Migration: Rename parent_customer_group_id to parent_id
Date: 2025-01-XX
Description: Simplify column name from parent_customer_group_id to parent_id for consistency across backend and frontend
"""

from alembic import op
import sqlalchemy as sa


def upgrade():
    # Drop foreign key constraint
    op.drop_constraint("fk_customer_groups_parent", "customer_groups", type_="foreignkey")
    
    # Drop index
    op.drop_index("ix_customer_groups_parent", table_name="customer_groups")
    
    # Rename the column
    op.alter_column(
        "customer_groups",
        "parent_customer_group_id",
        new_column_name="parent_id",
        existing_type=sa.String(),
        existing_nullable=True,
    )
    
    # Recreate index with new column name
    op.create_index(
        "ix_customer_groups_parent",
        "customer_groups",
        ["tenant_id", "parent_id"],
    )
    
    # Recreate foreign key constraint with new column name
    op.create_foreign_key(
        "fk_customer_groups_parent",
        "customer_groups",
        "customer_groups",
        ["parent_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade():
    # Drop foreign key constraint
    op.drop_constraint("fk_customer_groups_parent", "customer_groups", type_="foreignkey")
    
    # Drop index
    op.drop_index("ix_customer_groups_parent", table_name="customer_groups")
    
    # Rename the column back
    op.alter_column(
        "customer_groups",
        "parent_id",
        new_column_name="parent_customer_group_id",
        existing_type=sa.String(),
        existing_nullable=True,
    )
    
    # Recreate index with old column name
    op.create_index(
        "ix_customer_groups_parent",
        "customer_groups",
        ["tenant_id", "parent_customer_group_id"],
    )
    
    # Recreate foreign key constraint with old column name
    op.create_foreign_key(
        "fk_customer_groups_parent",
        "customer_groups",
        "customer_groups",
        ["parent_customer_group_id"],
        ["id"],
        ondelete="SET NULL",
    )

