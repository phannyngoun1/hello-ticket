"""
Database connection and session management

Author: Phanny
"""
import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
from app.infrastructure.shared.database.models import (
    # Sales master data
    CustomerTypeModel,
    CustomerGroupModel,
    # Ticketing master data
    VenueModel, LayoutModel, SectionModel, SeatModel,
    OrganizerModel, EventTypeModel,
    # Legacy models
    UserCacheModel,
    # UI Builder
    UISchemaModel, UISchemaVersionModel, UIPageModel, UICustomComponentModel,
    # Audit
    AuditLogModel,
    operational_metadata,
    # Sales master data
    BookingModel,
    # Ticketing master data
    ShowModel,
    # Ticketing master data
    EventModel,
    # Ticketing master data
    VenueTypeModel,
    # Sales master data
    EmployeeModel,
)

# Load environment variables from .env file
try:
    load_dotenv()
except (OSError, PermissionError):
    # Ignore missing or unreadable .env files in constrained environments (e.g., tests)
    pass


def _normalize_database_url(url: str) -> str:
    """Normalize DB URL: Railway and others may provide postgres://; we need postgresql://."""
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url


# Database URL from environment variable
# Default to PostgreSQL with single database configuration
DATABASE_URL = _normalize_database_url(
    os.getenv(
        "DATABASE_URL",
        "postgresql://ticket:ticket_pass@localhost:5432/ticket",
    )
)

# Create engine with PostgreSQL optimizations
engine = create_engine(
    DATABASE_URL, 
    echo=False,  # Set to True for SQL debugging
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True  # Verify connections before using
)


def _create_table_safe(eng, table, exc_codes_ok: bool) -> None:
    """Create one table; swallow only errors that mean 'this table already exists'.
    Use checkfirst=False so we always attempt CREATE TABLE (avoids dialect.has_table()
    incorrectly skipping creation e.g. on Railway). DuplicateTable / already-exists
    for this table are swallowed below.
    """
    from sqlalchemy.exc import ProgrammingError, OperationalError
    try:
        table.create(eng, checkfirst=False)
    except (ProgrammingError, OperationalError) as e:
        err_str = str(e).lower()
        if exc_codes_ok and hasattr(e, "orig"):
            try:
                import psycopg2.errors
                if isinstance(e.orig, psycopg2.errors.DuplicateTable):
                    return
            except ImportError:
                pass
        # Only swallow when the message clearly says this table already exists
        # (e.g. relation "file_uploads" already exists), not index/constraint.
        if "already exists" in err_str:
            name_lower = table.name.lower()
            if f'"{name_lower}"' in err_str or f"'{name_lower}'" in err_str:
                return
        raise


def create_db_and_tables() -> None:
    """Create operational database tables. Uses a fixed explicit order so that
    tables with no FKs (or whose refs exist) are created first. Never use
    operational_metadata.sorted_tables here—with SQLModel + custom metadata
    it can order tables wrong (e.g. attachment_links before file_uploads).
    """
    from app.infrastructure.shared.database.models import (
        CustomerTypeModel,
        CustomerGroupModel,
        EmployeeModel,
        VenueTypeModel,
        OrganizerModel,
        VenueModel,
        FileUploadModel,
        LayoutModel,
        SectionModel,
        SeatModel,
        EventTypeModel,
        ShowModel,
        EventModel,
        ShowImageModel,
        EventSeatModel,
        TicketModel,
        BookingModel,
        BookingItemModel,
        PaymentModel,
        CustomerModel,
        TagModel,
        TagLinkModel,
        UserCacheModel,
        UISchemaModel,
        UISchemaVersionModel,
        UIPageModel,
        UICustomComponentModel,
        AuditLogModel,
        SequenceModel,
        AttachmentLinkModel,
    )
    # Explicit order: file_uploads before layouts, sections, show_images, attachment_links
    operational_tables = [
        CustomerTypeModel.__table__,
        CustomerGroupModel.__table__,
        EmployeeModel.__table__,
        VenueTypeModel.__table__,
        OrganizerModel.__table__,
        VenueModel.__table__,
        FileUploadModel.__table__,
        LayoutModel.__table__,
        SectionModel.__table__,
        SeatModel.__table__,
        EventTypeModel.__table__,
        ShowModel.__table__,
        EventModel.__table__,
        ShowImageModel.__table__,
        EventSeatModel.__table__,
        TicketModel.__table__,
        BookingModel.__table__,
        BookingItemModel.__table__,
        PaymentModel.__table__,
        CustomerModel.__table__,
        TagModel.__table__,
        TagLinkModel.__table__,
        UserCacheModel.__table__,
        UISchemaModel.__table__,
        UISchemaVersionModel.__table__,
        UIPageModel.__table__,
        UICustomComponentModel.__table__,
        AuditLogModel.__table__,
        SequenceModel.__table__,
        AttachmentLinkModel.__table__,
    ]
    for table in operational_tables:
        _create_table_safe(engine, table, exc_codes_ok=True)


def get_session() -> Generator[Session, None, None]:
    """Get database session"""
    with Session(engine) as session:
        yield session


def get_session_sync() -> Session:
    """Get database session (synchronous)"""
    return Session(engine)


# Async database support for audit logging
try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    
    # Create async engine for operational database
    async_database_url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    async_engine = create_async_engine(
        async_database_url,
        echo=False,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True
    )
    
    async_session_maker = sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    _async_available = True
except (ImportError, ModuleNotFoundError):
    async_engine = None
    async_session_maker = None
    _async_available = False


async def get_async_session() -> AsyncSession:
    """Get async database session for audit logging"""
    if not _async_available or async_session_maker is None:
        raise RuntimeError(
            "Async database not available. Install asyncpg: pip install asyncpg"
        )
    return async_session_maker()

