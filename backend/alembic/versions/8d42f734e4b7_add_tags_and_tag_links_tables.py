"""add_tags_and_tag_links_tables

Revision ID: 8d42f734e4b7
Revises: b9bf0b5b9524
Create Date: 2026-01-03 13:09:25.598189

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8d42f734e4b7'
down_revision = 'b9bf0b5b9524'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('tenant_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),  # e.g., "customer", "event", "booking"
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('color', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tags_tenant_id', 'tags', ['tenant_id'])
    op.create_index('ix_tags_name', 'tags', ['name'])
    op.create_index('ix_tags_entity_type', 'tags', ['entity_type'])
    op.create_index('ix_tags_is_active', 'tags', ['is_active'])
    op.create_index('ix_tags_tenant_entity_name', 'tags', ['tenant_id', 'entity_type', 'name'], unique=True)
    op.create_index('ix_tags_tenant_active', 'tags', ['tenant_id', 'is_active'])
    op.create_index('ix_tags_tenant_entity', 'tags', ['tenant_id', 'entity_type'])

    # Create tag_links table
    op.create_table(
        'tag_links',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('tenant_id', sa.String(), nullable=False),
        sa.Column('tag_id', sa.String(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.Column('entity_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE')
    )
    op.create_index('ix_tag_links_tenant_id', 'tag_links', ['tenant_id'])
    op.create_index('ix_tag_links_tag_id', 'tag_links', ['tag_id'])
    op.create_index('ix_tag_links_entity_type', 'tag_links', ['entity_type'])
    op.create_index('ix_tag_links_entity_id', 'tag_links', ['entity_id'])
    op.create_index('ix_tag_links_tenant_tag', 'tag_links', ['tenant_id', 'tag_id'])
    op.create_index('ix_tag_links_entity', 'tag_links', ['entity_type', 'entity_id'])
    op.create_index('ix_tag_links_tenant_entity', 'tag_links', ['tenant_id', 'entity_type', 'entity_id'])
    op.create_index('ix_tag_links_unique', 'tag_links', ['tag_id', 'entity_type', 'entity_id'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_tag_links_unique', table_name='tag_links')
    op.drop_index('ix_tag_links_tenant_entity', table_name='tag_links')
    op.drop_index('ix_tag_links_entity', table_name='tag_links')
    op.drop_index('ix_tag_links_tenant_tag', table_name='tag_links')
    op.drop_index('ix_tag_links_entity_id', table_name='tag_links')
    op.drop_index('ix_tag_links_entity_type', table_name='tag_links')
    op.drop_index('ix_tag_links_tag_id', table_name='tag_links')
    op.drop_index('ix_tag_links_tenant_id', table_name='tag_links')
    op.drop_table('tag_links')
    
    op.drop_index('ix_tags_tenant_entity', table_name='tags')
    op.drop_index('ix_tags_tenant_active', table_name='tags')
    op.drop_index('ix_tags_tenant_entity_name', table_name='tags')
    op.drop_index('ix_tags_is_active', table_name='tags')
    op.drop_index('ix_tags_entity_type', table_name='tags')
    op.drop_index('ix_tags_name', table_name='tags')
    op.drop_index('ix_tags_tenant_id', table_name='tags')
    op.drop_table('tags')

