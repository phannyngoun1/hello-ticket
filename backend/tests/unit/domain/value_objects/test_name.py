"""
Unit tests for Name value object
"""
import pytest
from app.domain.shared.value_objects.name import Name
from app.shared.exceptions import ValidationError


class TestName:
    """Test Name value object"""
    
    def test_create_valid_name(self):
        """Test creating a valid name"""
        name = Name("John Doe")
        assert name.value == "John Doe"
    
    def test_create_empty_name_raises_error(self):
        """Test that empty name raises ValidationError"""
        with pytest.raises(ValidationError, match="cannot be empty"):
            Name("")
    
    def test_create_too_short_name_raises_error(self):
        """Test that name shorter than 2 characters raises error"""
        with pytest.raises(ValidationError, match="at least 2 characters"):
            Name("A")
    
    def test_create_too_long_name_raises_error(self):
        """Test that name longer than 100 characters raises error"""
        with pytest.raises(ValidationError, match="cannot exceed 100"):
            Name("A" * 101)
    
    def test_name_sanitization(self):
        """Test that name is sanitized (trimmed)"""
        name = Name("  John Doe  ")
        assert name.value == "John Doe"

