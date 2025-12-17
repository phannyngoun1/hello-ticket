"""
Migration: Add hierarchy fields to customer_groups
Date: 2025-11-30
Description: Introduce parent_customer_group_id, level, and sort_order columns to support tree structures.
"""

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column(
        "customer_groups",
        sa.Column("parent_customer_group_id", sa.String(), nullable=True),
    )
    op.add_column(
        "customer_groups",
        sa.Column("level", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "customer_groups",
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )

    op.create_index(
        "ix_customer_groups_parent",
        "customer_groups",
        ["tenant_id", "parent_customer_group_id"],
    )

    op.create_foreign_key(
        "fk_customer_groups_parent",
        "customer_groups",
        "customer_groups",
        ["parent_customer_group_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # Remove server defaults now that existing rows have been backfilled
    op.alter_column(
        "customer_groups",
        "level",
        server_default=None,
        existing_type=sa.Integer(),
    )
    op.alter_column(
        "customer_groups",
        "sort_order",
        server_default=None,
        existing_type=sa.Integer(),
    )


def downgrade():
    op.drop_constraint("fk_customer_groups_parent", "customer_groups", type_="foreignkey")
    op.drop_index("ix_customer_groups_parent", table_name="customer_groups")
    op.drop_column("customer_groups", "sort_order")
    op.drop_column("customer_groups", "level")
    op.drop_column("customer_groups", "parent_customer_group_id")

