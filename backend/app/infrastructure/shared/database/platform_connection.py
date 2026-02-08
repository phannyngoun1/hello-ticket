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


def _create_table_safe(engine, table, exc_codes_ok):
    """Create one table; swallow duplicate/already-exists errors."""
    from sqlalchemy.exc import ProgrammingError, OperationalError
    try:
        table.create(engine, checkfirst=True)
    except (ProgrammingError, OperationalError) as e:
        err_str = str(e).lower()
        if exc_codes_ok and e:
            try:
                import psycopg2.errors
                if hasattr(e, "orig") and isinstance(
                    e.orig,
                    (psycopg2.errors.DuplicateTable, psycopg2.errors.DuplicateObject),
                ):
                    return
            except ImportError:
                pass
        if "already exists" in err_str or "duplicate" in err_str:
            return
        raise


def create_platform_db_and_tables():
    """Create all platform database tables. Call this at app startup (single source of truth).
    Creates each table explicitly so it works even when custom metadata does not register
    tables for create_all (e.g. SQLModel + separate metadata).
    """
    from app.infrastructure.shared.database.platform_models import (
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
    # Create in dependency-friendly order: tenants first, then tenant-scoped tables
    platform_tables = [
        TenantModel.__table__,
        TenantSubscriptionModel.__table__,
        UserModel.__table__,
        SessionModel.__table__,
        GroupModel.__table__,
        UserGroupModel.__table__,
        RoleModel.__table__,
        UserRoleModel.__table__,
        GroupRoleModel.__table__,
        UserPreferenceModel.__table__,
    ]
    for table in platform_tables:
        _create_table_safe(platform_engine, table, exc_codes_ok=True)


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

