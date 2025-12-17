"""
TestBasic mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.sales.test_basic import TestBasic
from app.infrastructure.shared.database.models import TestBasicModel


class TestBasicMapper:
    """Mapper for TestBasic entity to TestBasicModel conversion"""
    
    @staticmethod
    def to_domain(model: TestBasicModel) -> TestBasic:
        """Convert database model to domain entity
        
        Args:
            model: TestBasicModel from database
            
        Returns:
            TestBasic domain entity
        """
        return TestBasic(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            test_basic_id=model.id,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    @staticmethod
    def to_model(test_basic: TestBasic) -> TestBasicModel:
        """Convert domain entity to database model
        
        Args:
            test_basic: TestBasic domain entity
            
        Returns:
            TestBasicModel for database persistence
        """
        return TestBasicModel(
            id=test_basic.id,
            tenant_id=test_basic.tenant_id,
            code=test_basic.code,
            name=test_basic.name,
            is_active=test_basic.is_active,
            version=test_basic.get_version(),
            created_at=test_basic.created_at,
            updated_at=test_basic.updated_at,
        )

