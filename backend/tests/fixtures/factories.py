"""
Test data factories for creating test objects
"""
from datetime import datetime, timezone
from typing import Optional
from faker import Faker
from app.domain.core.user.entity import User
from app.domain.shared.value_objects.email import Email
from app.domain.shared.value_objects.first_name import FirstName
from app.domain.shared.value_objects.last_name import LastName
from app.domain.inventory.item import Item
from app.shared.utils import generate_id

fake = Faker()


class UserFactory:
    """Factory for creating User test objects"""
    
    @staticmethod
    def create(
        username: Optional[str] = None,
        email: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        tenant_id: Optional[str] = None,
        is_active: bool = True,
    ) -> User:
        """Create a User for testing"""
        return User(
            id=generate_id(),
            username=username or fake.user_name(),
            first_name=FirstName(first_name or fake.first_name()),
            last_name=LastName(last_name or fake.last_name()),
            email=Email(email or fake.email()),
            tenant_id=tenant_id or f"tenant-{generate_id()}",
            is_active=is_active,
        )
    
    @staticmethod
    def create_batch(count: int, **kwargs) -> list[User]:
        """Create multiple users"""
        return [UserFactory.create(**kwargs) for _ in range(count)]


class ItemFactory:
    """Factory for creating Item test objects"""
    
    @staticmethod
    def create(
        sku: Optional[str] = None,
        name: Optional[str] = None,
        tenant_id: Optional[str] = None,
        **kwargs
    ) -> Item:
        """Create an Item for testing"""
        return Item(
            id=generate_id(),
            sku=sku or f"SKU-{fake.uuid4()[:8]}",
            name=name or fake.company(),
            tenant_id=tenant_id or f"tenant-{generate_id()}",
            **kwargs
        )

