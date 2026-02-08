"""
Platform database connection management

NOTE: This module now uses the SAME database as operational data.
The platform/operational split has been consolidated into a single database.

This module handles connections to platform-level data:
- Tenants (registry of all tenants)
- Subscriptions (billing and plan information)
- Users (authentication and identity)
- Sessions (session management and device tracking)
- Roles (system and custom roles)
- Groups (user groups and role assignments)
"""
import os
from dotenv import load_dotenv
from sqlmodel import create_engine, SQLModel, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import sessionmaker
from app.infrastructure.shared.database.platform_models import platform_metadata
import logging

logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()


def _normalize_database_url(url: str) -> str:
    """Normalize DB URL: Railway and others may provide postgres://; we need postgresql://."""
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url


# Get database URL from environment - SAME as operational database
DATABASE_URL = _normalize_database_url(
    os.getenv(
        "DATABASE_URL",
        "postgresql://ticket:ticket_pass@localhost:5432/ticket",
    )
)

# For async operations, use asyncpg if available
try:
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    async_platform_engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)
    _async_available = True
except ModuleNotFoundError:
    async_platform_engine = None
    _async_available = False
    logger.warning("⚠️  asyncpg not installed. Install with: pip install asyncpg")
    logger.warning("   Falling back to sync database operations for role sync")

# Create sync engine for initialization and fallback
platform_engine = create_engine(DATABASE_URL, echo=False)

# Create async session maker if async is available
if _async_available:
    async_platform_session_maker = sessionmaker(
        async_platform_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
else:
    async_platform_session_maker = None


def create_platform_db_and_tables():
    """Create all platform database tables. Call this at app startup (single source of truth)."""
    from sqlalchemy.exc import ProgrammingError, OperationalError
    try:
        import psycopg2.errors
    except ImportError:
        psycopg2 = None

    # Ensure all platform models are registered with platform_metadata before create_all
    # (SQLModel only adds tables to metadata when the model class is imported)
    from app.infrastructure.shared.database.platform_models import (  # noqa: F401
        TenantModel,
        TenantSubscriptionModel,
        UserModel,
        SessionModel,
        GroupModel,
        UserGroupModel,
        RoleModel,
        UserRoleModel,
        GroupRoleModel,
        UserPreferenceModel,
    )

    try:
        platform_metadata.create_all(platform_engine, checkfirst=True)
    except (ProgrammingError, OperationalError) as e:
        # Handle cases where tables/indexes already exist
        # psycopg2 raises ProgrammingError with specific error codes
        if psycopg2 and hasattr(e, 'orig'):
            if isinstance(e.orig, (psycopg2.errors.DuplicateTable, psycopg2.errors.DuplicateObject)):
                # Table/index already exists, which is fine
                logger.debug("Platform tables/indexes already exist, skipping creation")
                pass
            else:
                # Check error message for "already exists" or "duplicate"
                error_str = str(e).lower()
                if "already exists" in error_str or "duplicate" in error_str:
                    # Tables/indexes already exist, which is fine
                    logger.debug("Platform tables/indexes already exist, skipping creation")
                    pass
                else:
                    # Re-raise if it's a different error
                    raise
        else:
            # Check error message for "already exists" or "duplicate"
            error_str = str(e).lower()
            if "already exists" in error_str or "duplicate" in error_str:
                # Tables/indexes already exist, which is fine
                logger.debug("Platform tables/indexes already exist, skipping creation")
                pass
            else:
                # Re-raise if it's a different error
                raise


def get_platform_session() -> AsyncSession:
    """Get a platform database session (async)"""
    if not _async_available or async_platform_session_maker is None:
        raise RuntimeError(
            "Async database not available. Install asyncpg: pip install asyncpg"
        )
    return async_platform_session_maker()


def get_platform_session_sync() -> Session:
    """Get a platform database session (sync) - fallback for when asyncpg is not available"""
    return Session(platform_engine)


async def get_platform_session_dependency():
    """Dependency to get platform database session"""
    if not _async_available or async_platform_session_maker is None:
        raise RuntimeError(
            "Async database not available. Install asyncpg: pip install asyncpg"
        )
    async with async_platform_session_maker() as session:
        yield session

