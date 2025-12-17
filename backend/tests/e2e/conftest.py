"""
Shared fixtures for E2E tests
"""
import pytest
from httpx import AsyncClient
from typing import AsyncGenerator, Dict
from app.main import app
from app.shared.utils import generate_id


@pytest.fixture(scope="session")
async def test_client() -> AsyncGenerator[AsyncClient, None]:
    """Create a test HTTP client for all E2E tests"""
    async with AsyncClient(app=app, base_url="http://test", timeout=30.0) as client:
        yield client


@pytest.fixture
async def test_tenant_id(test_client: AsyncClient) -> str:
    """Create a test tenant and return its ID"""
    tenant_data = {
        "name": f"Test Tenant {generate_id()}",
        "code": f"test-{generate_id()[:8]}"
    }
    response = await test_client.post("/api/v1/tenants", json=tenant_data)
    assert response.status_code == 201
    return response.json()["id"]


@pytest.fixture
async def authenticated_user(test_client: AsyncClient, test_tenant_id: str) -> Dict[str, str]:
    """Create a test user, register, login, and return auth info"""
    # Register user
    register_data = {
        "username": f"testuser_{generate_id()[:8]}",
        "email": f"test_{generate_id()[:8]}@example.com",
        "password": "SecurePass123!",
        "first_name": "Test",
        "last_name": "User",
        "tenant_id": test_tenant_id
    }
    register_response = await test_client.post("/api/v1/auth/register", json=register_data)
    assert register_response.status_code == 201
    
    # Login
    login_data = {
        "username": register_data["username"],
        "password": register_data["password"]
    }
    login_response = await test_client.post("/api/v1/auth/login", json=login_data)
    assert login_response.status_code == 200
    token_data = login_response.json()
    
    return {
        "user_id": register_response.json()["id"],
        "username": register_data["username"],
        "email": register_data["email"],
        "tenant_id": test_tenant_id,
        "access_token": token_data["access_token"],
        "token_type": token_data["token_type"]
    }


@pytest.fixture
def auth_headers(authenticated_user: Dict[str, str]) -> Dict[str, str]:
    """Create authentication headers from authenticated user"""
    return {
        "Authorization": f"{authenticated_user['token_type']} {authenticated_user['access_token']}",
        "X-Tenant-ID": authenticated_user["tenant_id"]
    }

