"""
Test mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.sales.test import Test
from app.infrastructure.shared.database.models import TestModel


class TestMapper:
    """Mapper for Test entity to TestModel conversion"""
    
    @staticmethod
    def to_domain(model: TestModel) -> Test:
        """Convert database model to domain entity
        
        Args:
            model: TestModel from database
            
        Returns:
            Test domain entity
        """
        return Test(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            test_id=model.id,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    @staticmethod
    def to_model(test: Test) -> TestModel:
        """Convert domain entity to database model
        
        Args:
            test: Test domain entity
            
        Returns:
            TestModel for database persistence
        """
        return TestModel(
            id=test.id,
            tenant_id=test.tenant_id,
            code=test.code,
            name=test.name,
            is_active=test.is_active,
            version=test.get_version(),
            created_at=test.created_at,
            updated_at=test.updated_at,
        )

