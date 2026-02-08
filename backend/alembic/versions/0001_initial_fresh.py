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

    # Use SQLAlchemy's create_all which properly handles FK dependencies
    # checkfirst=True prevents errors if tables already exist
    operational_metadata.create_all(bind=op.get_bind(), checkfirst=True)


def downgrade() -> None:
    """Drop all operational tables."""
    from app.infrastructure.shared.database.models import operational_metadata
    operational_metadata.drop_all(bind=op.get_bind())
