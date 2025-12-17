"""
TestTree mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.sales.test_tree import TestTree
from app.infrastructure.shared.database.models import TestTreeModel


class TestTreeMapper:
    """Mapper for TestTree entity to TestTreeModel conversion"""
    
    @staticmethod
    def to_domain(model: TestTreeModel) -> TestTree:
        """Convert database model to domain entity
        
        Args:
            model: TestTreeModel from database
            
        Returns:
            TestTree domain entity
        """
        return TestTree(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            test_tree_id=model.id,
            parent_test_tree_id=model.parent_test_tree_id,
            level=model.level,
            sort_order=model.sort_order,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    @staticmethod
    def to_model(test_tree: TestTree) -> TestTreeModel:
        """Convert domain entity to database model
        
        Args:
            test_tree: TestTree domain entity
            
        Returns:
            TestTreeModel for database persistence
        """
        return TestTreeModel(
            id=test_tree.id,
            tenant_id=test_tree.tenant_id,
            code=test_tree.code,
            name=test_tree.name,

            parent_test_tree_id=test_tree.parent_test_tree_id,
            level=test_tree.level,
            sort_order=test_tree.sort_order,
            is_active=test_tree.is_active,
            version=test_tree.get_version(),
            created_at=test_tree.created_at,
            updated_at=test_tree.updated_at,
        )

