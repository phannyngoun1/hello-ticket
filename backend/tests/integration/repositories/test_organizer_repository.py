"""Integration tests for OrganizerRepository"""
import pytest
from sqlmodel import create_engine, Session
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, INET
from sqlalchemy import JSON, String

# Register type compilers for SQLite BEFORE importing models
@compiles(ARRAY, "sqlite")
def compile_array(element, compiler, **kw):
    return "JSON"

@compiles(JSONB, "sqlite")
def compile_jsonb(element, compiler, **kw):

from app.infrastructure.ticketing.organizer_repository import SQLOrganizerRepository
from app.domain.ticketing.organizer import Organizer

# Use in-memory SQLite for sync tests matching the repository implementation
TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture(name="sync_engine")
def fixture_sync_engine():
    engine = create_engine(
        TEST_DB_URL, 
        connect_args={"check_same_thread": False}, 
        poolclass=StaticPool
    )
    # Create tables manually to avoid issues with Postgres-specific types
    with engine.begin() as conn:
        # Create organizers table
        conn.exec_driver_sql("""
            CREATE TABLE IF NOT EXISTS organizers (
                id VARCHAR NOT NULL PRIMARY KEY,
                tenant_id VARCHAR NOT NULL,
                code VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                description VARCHAR,
                email VARCHAR,
                phone VARCHAR,
                website VARCHAR,
                address VARCHAR,
                city VARCHAR,
                country VARCHAR,
                logo VARCHAR,
                is_active BOOLEAN NOT NULL DEFAULT 1,
                is_deleted BOOLEAN NOT NULL DEFAULT 0,
                version INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted_at TIMESTAMP
            )
        """)
        # Create tags table
        conn.exec_driver_sql("""
            CREATE TABLE IF NOT EXISTS tags (
                id VARCHAR NOT NULL PRIMARY KEY,
                tenant_id VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                entity_type VARCHAR NOT NULL,
                description VARCHAR,
                color VARCHAR,
                is_active BOOLEAN NOT NULL DEFAULT 1,
                version INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
        """)
        # Create tag_links table
        conn.exec_driver_sql("""
            CREATE TABLE IF NOT EXISTS tag_links (
                id VARCHAR NOT NULL PRIMARY KEY,
                tenant_id VARCHAR NOT NULL,
                tag_id VARCHAR NOT NULL,
                entity_type VARCHAR NOT NULL,
                entity_id VARCHAR NOT NULL,
                created_at TIMESTAMP NOT NULL,
                FOREIGN KEY (tag_id) REFERENCES tags(id)
            )
        """)
    return engine

@pytest.fixture(name="sync_session_factory")
def fixture_sync_session_factory(sync_engine):
    def get_session():
        return Session(sync_engine)
    return get_session

@pytest.fixture(name="repository")
def fixture_repository(sync_session_factory):
    # Tenant ID for testing
    tenant_id = "test-tenant-123"
    return SQLOrganizerRepository(session=sync_session_factory, tenant_id=tenant_id)

@pytest.mark.asyncio
async def test_create_and_get_organizer(repository):
    tenant_id = "test-tenant-123"
    
    # Create Organizer Domain Entity
    organizer = Organizer(
        tenant_id=tenant_id,
        name="Test Organizer",
        code="ORG-001",
        email="test@organizer.com",
        tags=["tag1", "tag2"]
    )
    
    # Save
    saved_organizer = await repository.save(organizer)
    
    assert saved_organizer.id is not None
    assert saved_organizer.name == "Test Organizer"
    assert "tag1" in saved_organizer.tags
    assert "tag2" in saved_organizer.tags
    
    # Get by ID
    fetched_organizer = await repository.get_by_id(tenant_id, saved_organizer.id)
    assert fetched_organizer is not None
    assert fetched_organizer.id == saved_organizer.id
    assert fetched_organizer.name == "Test Organizer"
    assert len(fetched_organizer.tags) == 2
    assert "tag1" in fetched_organizer.tags

@pytest.mark.asyncio
async def test_update_organizer_tags(repository):
    tenant_id = "test-tenant-123"
    
    organizer = Organizer(
        tenant_id=tenant_id,
        name="Update Organizer",
        code="ORG-002",
        email="update@organizer.com",
        tags=["initial"]
    )
    saved = await repository.save(organizer)
    
    # Update
    saved.tags = ["initial", "new_tag"]
    updated = await repository.save(saved)
    
    assert len(updated.tags) == 2
    assert "new_tag" in updated.tags
    
    # Verify persistence
    fetched = await repository.get_by_id(tenant_id, saved.id)
    assert len(fetched.tags) == 2
    assert "new_tag" in fetched.tags

@pytest.mark.asyncio
async def test_delete_organizer(repository):
    tenant_id = "test-tenant-123"
    
    organizer = Organizer(
        tenant_id=tenant_id,
        name="Delete Organizer",
        code="ORG-003",
        email="delete@organizer.com"
    )
    saved = await repository.save(organizer)
    
    # Delete
    result = await repository.delete(tenant_id, saved.id)
    assert result is True
    
    # Verify deleted
    fetched = await repository.get_by_id(tenant_id, saved.id)
    # BaseSQLRepository soft deletes by default if is_deleted exists
    # OrganizerModel inherits from OperationalModel which usually has is_deleted or we check specifics.
    # If soft deleted, get_by_id usually filters it out.
    assert fetched is None
