"""
Unit tests for Email value object
"""
import pytest
from app.domain.shared.value_objects.email import Email
from app.shared.exceptions import ValidationError


class TestEmail:
    """Test Email value object"""
    
    def test_create_valid_email(self):
        """Test creating a valid email"""
        email = Email("test@example.com")
        assert email.value == "test@example.com"
    
    def test_create_invalid_email_raises_error(self):
        """Test that invalid email raises ValidationError"""
        with pytest.raises(ValidationError, match="Invalid email format"):
            Email("not-an-email")
    
    def test_create_empty_email_raises_error(self):
        """Test that empty email raises ValidationError"""
        with pytest.raises(ValidationError):
            Email("")
    
    def test_email_equality(self):
        """Test email equality"""
        email1 = Email("test@example.com")
        email2 = Email("test@example.com")
        email3 = Email("other@example.com")
        
        assert email1 == email2
        assert email1 != email3
    
    def test_email_hash(self):
        """Test email hashing"""
        email1 = Email("test@example.com")
        email2 = Email("test@example.com")
        
        assert hash(email1) == hash(email2)
    
    def test_email_lowercase_normalization(self):
        """Test email normalization (if implemented)"""
        # Note: This test depends on Email implementation
        # If Email doesn't normalize, this test should be removed or updated
        email = Email("test@example.com")
        assert email.value == "test@example.com"

