"""
Unit tests for User domain entity
"""
import pytest
from datetime import datetime, timezone
from app.domain.core.user.entity import User
from app.domain.shared.value_objects.email import Email
from app.domain.shared.value_objects.first_name import FirstName
from app.domain.shared.value_objects.last_name import LastName
from tests.fixtures.factories import UserFactory


@pytest.mark.unit
class TestUser:
    """Test User domain entity"""
    
    def test_create_user(self):
        """Test creating a user"""
        user = UserFactory.create(
            username="john_doe",
            email="john@example.com"
        )
        
        assert user.username == "john_doe"
        assert user.email.value == "john@example.com"
        assert user.is_active is True
    
    def test_update_username(self):
        """Test updating username"""
        user = UserFactory.create()
        new_username = "new_username"
        
        user.update_username(new_username)
        
        assert user.username == new_username
        assert user.updated_at > user.created_at
    
    def test_update_names(self):
        """Test updating first and last name"""
        user = UserFactory.create()
        new_first = FirstName("Jane")
        new_last = LastName("Smith")
        
        user.update_names(new_first, new_last)
        
        assert user.first_name == new_first
        assert user.last_name == new_last
        assert user.updated_at > user.created_at
    
    def test_get_full_name(self):
        """Test getting full name"""
        user = UserFactory.create(
            first_name="John",
            last_name="Doe"
        )
        
        assert user.get_full_name() == "John Doe"

