
import pytest
from sqlmodel import SQLModel, create_engine, Session, select
from app.infrastructure.shared.database.models import OrganizerModel
from app.infrastructure.ticketing.organizer_repository import SQLOrganizerRepository
from app.domain.ticketing.organizer import Organizer
from app.infrastructure.shared.database.connection import operational_metadata

# Use in-memory SQLite for sync tests matching the repository implementation
TEST_DB_URL = "sqlite:///:memory:"

from sqlalchemy.pool import StaticPool

@pytest.fixture(name="sync_engine")
def fixture_sync_engine():
    engine = create_engine(
        TEST_DB_URL, 
        connect_args={"check_same_thread": False}, 
        poolclass=StaticPool
    )
    operational_metadata.create_all(engine)
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
