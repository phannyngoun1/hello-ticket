"""
Shared pytest fixtures for all tests
"""
import pytest
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from app.shared.utils import generate_id

# Test database URL (in-memory SQLite for speed)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Lazy initialization of test engine (only when needed)
_test_engine = None
_TestSessionLocal = None


def get_test_engine():
    """Get or create test engine"""
    global _test_engine
    if _test_engine is None:
        _test_engine = create_async_engine(
            TEST_DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=False,
        )
    return _test_engine


def get_test_session_local():
    """Get or create test session maker"""
    global _TestSessionLocal
    if _TestSessionLocal is None:
        _TestSessionLocal = async_sessionmaker(
            get_test_engine(), class_=AsyncSession, expire_on_commit=False
        )
    return _TestSessionLocal


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session"""
    # Lazy import to avoid import-time side effects
    from app.infrastructure.shared.database.models import operational_metadata
    from app.infrastructure.shared.database.platform_models import platform_metadata
    
    test_engine = get_test_engine()
    TestSessionLocal = get_test_session_local()
    
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(operational_metadata.create_all)
        await conn.run_sync(platform_metadata.create_all)
    
    async with TestSessionLocal() as session:
        yield session
    
    # Clean up
    async with test_engine.begin() as conn:
        await conn.run_sync(operational_metadata.drop_all)
        await conn.run_sync(platform_metadata.drop_all)


@pytest.fixture
def test_tenant_id() -> str:
    """Generate a test tenant ID"""
    return f"test-tenant-{generate_id()}"

