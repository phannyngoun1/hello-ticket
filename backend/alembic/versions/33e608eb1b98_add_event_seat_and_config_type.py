"""add_event_seat_and_config_type

Revision ID: 33e608eb1b98
Revises: 63a95d184528
Create Date: 2025-12-27 16:34:34.216309

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '33e608eb1b98'
down_revision = '63a95d184528'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 0. Drop if exists (safeguard against auto-created tables)
    op.execute("DROP TABLE IF EXISTS event_seats CASCADE")

    # 1. Update events table
    op.add_column('events', sa.Column('configuration_type', sa.String(), nullable=True, server_default='seat_setup'))
    op.create_index('ix_events_tenant_configuration', 'events', ['tenant_id', 'configuration_type'], unique=False)

    # 2. Create event_seats table
    op.create_table('event_seats',
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('tenant_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('event_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('seat_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('status', sa.Enum('AVAILABLE', 'RESERVED', 'SOLD', 'HELD', 'BLOCKED', name='eventseatstatusenum', native_enum=False), nullable=True),
        sa.Column('section_name', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('row_name', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('seat_number', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('ticket_code', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('broker_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('attributes', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
        sa.ForeignKeyConstraint(['seat_id'], ['seats.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_event_seats_broker_id'), 'event_seats', ['broker_id'], unique=False)
    op.create_index(op.f('ix_event_seats_event_id'), 'event_seats', ['event_id'], unique=False)
    op.create_index('ix_event_seats_event_location', 'event_seats', ['event_id', 'section_name', 'row_name', 'seat_number'], unique=False)
    op.create_index('ix_event_seats_event_status', 'event_seats', ['event_id', 'status'], unique=False)
    op.create_index(op.f('ix_event_seats_is_active'), 'event_seats', ['is_active'], unique=False)
    op.create_index(op.f('ix_event_seats_row_name'), 'event_seats', ['row_name'], unique=False)
    op.create_index(op.f('ix_event_seats_seat_id'), 'event_seats', ['seat_id'], unique=False)
    op.create_index(op.f('ix_event_seats_seat_number'), 'event_seats', ['seat_number'], unique=False)
    op.create_index(op.f('ix_event_seats_section_name'), 'event_seats', ['section_name'], unique=False)
    op.create_index(op.f('ix_event_seats_status'), 'event_seats', ['status'], unique=False)
    op.create_index('ix_event_seats_tenant_active', 'event_seats', ['tenant_id', 'is_active'], unique=False)
    op.create_index(op.f('ix_event_seats_tenant_id'), 'event_seats', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_event_seats_ticket_code'), 'event_seats', ['ticket_code'], unique=False)
    op.create_index('ix_event_seats_broker', 'event_seats', ['tenant_id', 'broker_id'], unique=False)

    # 3. Fix other indexes if needed
    op.drop_index('ix_audit_logs_event_type', table_name='audit_logs')
    op.create_index('ix_audit_logs_event_type', 'audit_logs', ['event_type', 'timestamp'], unique=False)
    op.drop_index('ix_file_uploads_uploaded_by', table_name='file_uploads')
    op.create_index(op.f('ix_file_uploads_uploaded_by'), 'file_uploads', ['uploaded_by'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_file_uploads_uploaded_by'), table_name='file_uploads')
    op.create_index('ix_file_uploads_uploaded_by', 'file_uploads', ['tenant_id', 'uploaded_by'], unique=False)
    op.drop_index('ix_audit_logs_event_type', table_name='audit_logs')
    op.create_index('ix_audit_logs_event_type', 'audit_logs', ['event_type'], unique=False)
    
    op.drop_table('event_seats')
    
    op.drop_index('ix_events_tenant_configuration', table_name='events')
    op.drop_column('events', 'configuration_type')
