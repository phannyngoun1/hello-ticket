"""add_entity_type_to_tags_table

Revision ID: bc5e5583159c
Revises: 85b015a49ac4
Create Date: 2026-01-03 13:32:43.187936

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bc5e5583159c'
down_revision = '85b015a49ac4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add entity_type column to tags table if it doesn't exist
    # This column was missing from the original tags table creation
    op.add_column('tags', 
        sa.Column('entity_type', sa.String(), nullable=True)  # Allow NULL initially for existing data
    )
    
    # Set a default value for existing rows (e.g., 'customer' as default)
    op.execute("UPDATE tags SET entity_type = 'customer' WHERE entity_type IS NULL")
    
    # Now make it NOT NULL
    op.alter_column('tags', 'entity_type', nullable=False)
    
    # Create index on entity_type if it doesn't exist
    try:
        op.create_index('ix_tags_entity_type', 'tags', ['entity_type'])
    except:
        pass  # Index might already exist
    
    # Create unique index on tenant_id, entity_type, name if it doesn't exist
    try:
        op.create_index('ix_tags_tenant_entity_name', 'tags', ['tenant_id', 'entity_type', 'name'], unique=True)
    except:
        pass  # Index might already exist
    
    # Create index on tenant_id, entity_type if it doesn't exist
    try:
        op.create_index('ix_tags_tenant_entity', 'tags', ['tenant_id', 'entity_type'])
    except:
        pass  # Index might already exist


def downgrade() -> None:
    # Remove indexes
    try:
        op.drop_index('ix_tags_tenant_entity', table_name='tags')
    except:
        pass
    try:
        op.drop_index('ix_tags_tenant_entity_name', table_name='tags')
    except:
        pass
    try:
        op.drop_index('ix_tags_entity_type', table_name='tags')
    except:
        pass
    
    # Remove entity_type column
    op.drop_column('tags', 'entity_type')

