"""Initial migration - create all operational tables

Revision ID: 0001_initial
Revises:
Create Date: 2026-02-08

Creates all operational tables using Alembic's create_all which handles
foreign key dependencies correctly within a single transaction.
"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all operational tables using metadata."""
    import sqlalchemy as sa
    from sqlalchemy import inspect

    # Import models to register them in metadata
    from app.infrastructure.shared.database.models import (
        CustomerTypeModel, CustomerGroupModel, EmployeeModel,
        VenueTypeModel, OrganizerModel, VenueModel,
        FileUploadModel, LayoutModel, SectionModel, SeatModel,
        EventTypeModel, ShowModel, EventModel, ShowImageModel,
        EventSeatModel, TicketModel, BookingModel, BookingItemModel,
        PaymentModel, CustomerModel, TagModel, TagLinkModel,
        UserCacheModel, UISchemaModel, UISchemaVersionModel,
        UIPageModel, UICustomComponentModel, AuditLogModel,
        SequenceModel, AttachmentLinkModel, operational_metadata
    )

    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    # Create tables first (without indexes to avoid conflicts)
    for table in operational_metadata.sorted_tables:
        if table.name not in existing_tables:
            table.create(bind, checkfirst=True)

    # Then create indexes separately, handling duplicates gracefully
    for table in operational_metadata.sorted_tables:
        existing_indexes = {idx['name'] for idx in inspector.get_indexes(table.name)} if table.name in existing_tables else set()
        for index in table.indexes:
            if index.name not in existing_indexes:
                try:
                    index.create(bind)
                except sa.exc.ProgrammingError as e:
                    # Index might already exist, skip it
                    if 'already exists' not in str(e):
                        raise


def downgrade() -> None:
    """Drop all operational tables."""
    from app.infrastructure.shared.database.models import operational_metadata
    operational_metadata.drop_all(bind=op.get_bind())
