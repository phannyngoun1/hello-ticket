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
    TestEntityModel, TestModel, CustomerTypeModel,
    CustomerGroupModel, TestTreeBackendModel, TestTreeModel, TestBasicModel,
    # Ticketing master data
    VenueModel, LayoutModel, SectionModel, SeatModel,
    OrganizerModel, EventTypeModel,
    # Legacy models
    UserCacheModel,
    # UI Builder
    UISchemaModel, UISchemaVersionModel, UIPageModel, UICustomComponentModel,
    # Audit
    AuditLogModel,
    operational_metadata
,
    # Sales master data
    BookingModel,
    # Ticketing master data
    ShowModel,
    # Ticketing master data
    EventModel,
    # Ticketing master data
    VenueTypeModel)

# Load environment variables from .env file
try:
    load_dotenv()
except (OSError, PermissionError):
    # Ignore missing or unreadable .env files in constrained environments (e.g., tests)
    pass

# Database URL from environment variable
# Default to PostgreSQL with single database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://ticket:ticket_pass@localhost:5432/ticket"
)

# Create engine with PostgreSQL optimizations
engine = create_engine(
    DATABASE_URL, 
    echo=False,  # Set to True for SQL debugging
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True  # Verify connections before using
)


def create_db_and_tables() -> None:
    """Create operational database tables (only operational models, not platform ones)"""
    from sqlalchemy.exc import ProgrammingError, OperationalError
    try:
        import psycopg2.errors
    except ImportError:
        psycopg2 = None
    
    try:
        operational_metadata.create_all(engine, checkfirst=True)
    except (ProgrammingError, OperationalError) as e:
        # Handle cases where tables/indexes already exist
        # psycopg2 raises ProgrammingError with specific error codes
        if psycopg2 and hasattr(e, 'orig'):
            if isinstance(e.orig, (psycopg2.errors.DuplicateTable, psycopg2.errors.DuplicateObject)):
                # Table/index already exists, which is fine
                pass
            else:
                # Check error message for "already exists" or "duplicate"
                error_str = str(e).lower()
                if "already exists" in error_str or "duplicate" in error_str:
                    # Tables/indexes already exist, which is fine
                    pass
                else:
                    # Re-raise if it's a different error
                    raise
        else:
            # Check error message for "already exists" or "duplicate"
            error_str = str(e).lower()
            if "already exists" in error_str or "duplicate" in error_str:
                # Tables/indexes already exist, which is fine
                pass
            else:
                # Re-raise if it's a different error
                raise


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

