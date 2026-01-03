"""add_customers_table

Revision ID: b9bf0b5b9524
Revises: a13e9eb26c99
Create Date: 2026-01-03 12:08:34.389912

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'b9bf0b5b9524'
down_revision = 'a13e9eb26c99'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'customers',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('tenant_id', sa.String(), nullable=False),
        sa.Column('code', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('business_name', sa.String(), nullable=True),
        sa.Column('street_address', sa.String(), nullable=True),
        sa.Column('city', sa.String(), nullable=True),
        sa.Column('state_province', sa.String(), nullable=True),
        sa.Column('postal_code', sa.String(), nullable=True),
        sa.Column('country', sa.String(), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('gender', sa.String(), nullable=True),
        sa.Column('nationality', sa.String(), nullable=True),
        sa.Column('id_number', sa.String(), nullable=True),
        sa.Column('id_type', sa.String(), nullable=True),
        sa.Column('account_manager_id', sa.String(), nullable=True),
        sa.Column('sales_representative_id', sa.String(), nullable=True),
        sa.Column('customer_since', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_purchase_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_purchase_amount', sa.Numeric(), nullable=False, server_default='0.0'),
        sa.Column('last_contact_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('event_preferences', sa.String(), nullable=True),
        sa.Column('seating_preferences', sa.String(), nullable=True),
        sa.Column('accessibility_needs', sa.String(), nullable=True),
        sa.Column('dietary_restrictions', sa.String(), nullable=True),
        sa.Column('emergency_contact_name', sa.String(), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(), nullable=True),
        sa.Column('emergency_contact_relationship', sa.String(), nullable=True),
        sa.Column('preferred_language', sa.String(), nullable=True),
        sa.Column('marketing_opt_in', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('email_marketing', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('sms_marketing', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('facebook_url', sa.String(), nullable=True),
        sa.Column('twitter_handle', sa.String(), nullable=True),
        sa.Column('linkedin_url', sa.String(), nullable=True),
        sa.Column('instagram_handle', sa.String(), nullable=True),
        sa.Column('website', sa.String(), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('priority', sa.String(), nullable=True),
        sa.Column('status_reason', sa.String(), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('public_notes', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deactivated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_customers_tenant_code', 'customers', ['tenant_id', 'code'], unique=True)
    op.create_index('ix_customers_tenant_active', 'customers', ['tenant_id', 'is_active'], unique=False)
    op.create_index('ix_customers_tenant_email', 'customers', ['tenant_id', 'email'], unique=False)
    op.create_index(op.f('ix_customers_code'), 'customers', ['code'], unique=False)
    op.create_index(op.f('ix_customers_name'), 'customers', ['name'], unique=False)
    op.create_index(op.f('ix_customers_tenant_id'), 'customers', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_customers_email'), 'customers', ['email'], unique=False)
    op.create_index(op.f('ix_customers_city'), 'customers', ['city'], unique=False)
    op.create_index(op.f('ix_customers_priority'), 'customers', ['priority'], unique=False)
    op.create_index(op.f('ix_customers_account_manager_id'), 'customers', ['account_manager_id'], unique=False)
    op.create_index(op.f('ix_customers_sales_representative_id'), 'customers', ['sales_representative_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_customers_sales_representative_id'), table_name='customers')
    op.drop_index(op.f('ix_customers_account_manager_id'), table_name='customers')
    op.drop_index(op.f('ix_customers_priority'), table_name='customers')
    op.drop_index(op.f('ix_customers_city'), table_name='customers')
    op.drop_index(op.f('ix_customers_email'), table_name='customers')
    op.drop_index(op.f('ix_customers_tenant_id'), table_name='customers')
    op.drop_index(op.f('ix_customers_name'), table_name='customers')
    op.drop_index(op.f('ix_customers_code'), table_name='customers')
    op.drop_index('ix_customers_tenant_email', table_name='customers')
    op.drop_index('ix_customers_tenant_active', table_name='customers')
    op.drop_index('ix_customers_tenant_code', table_name='customers')
    op.drop_table('customers')

