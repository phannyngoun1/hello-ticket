"""
Database connection - re-exports from operational connection (single database).

All tables (tenants, users, sessions, roles, and business data) live in one
operational database. Use this module only for backward-compatible imports;
new code should use app.infrastructure.shared.database.connection.
"""
from app.infrastructure.shared.database.connection import (
    create_db_and_tables as create_platform_db_and_tables,
    get_async_session as get_platform_session,
    get_session_sync as get_platform_session_sync,
    async_session_maker as async_platform_session_maker,
)

__all__ = [
    "create_platform_db_and_tables",
    "get_platform_session",
    "get_platform_session_sync",
    "async_platform_session_maker",
]


async def get_platform_session_dependency():
    """Dependency to get database session (async)."""
    from app.infrastructure.shared.database.connection import async_session_maker
    async with async_session_maker() as session:
        yield session
