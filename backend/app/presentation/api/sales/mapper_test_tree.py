"""API mapper for Sales module"""
from typing import List
from app.domain.sales.test_tree import TestTree
from app.presentation.api.sales.schemas_test_tree import (
    TestTreeResponse,
    TestTreeTreeResponse,
)


class SalesApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def test_tree_to_response(test_tree: TestTree) -> TestTreeResponse:
        return TestTreeResponse(
            id=test_tree.id,
            tenant_id=test_tree.tenant_id,
            code=test_tree.code,
            name=test_tree.name,
            parent_test_tree_id=test_tree.parent_test_tree_id,
            level=test_tree.level,
            sort_order=test_tree.sort_order,

            is_active=test_tree.is_active,
            created_at=test_tree.created_at,
            updated_at=test_tree.updated_at,
            deactivated_at=test_tree.deactivated_at,
        )

    @staticmethod
    def test_tree_tree_to_response(test_tree: TestTree) -> TestTreeTreeResponse:
        """Convert TestTree with children to TestTreeTreeResponse recursively"""
        children = [
            SalesApiMapper.test_tree_tree_to_response(child)
            for child in test_tree.children
        ]
        
        return TestTreeTreeResponse(
            id=test_tree.id,
            tenant_id=test_tree.tenant_id,
            code=test_tree.code,
            name=test_tree.name,
            parent_test_tree_id=test_tree.parent_test_tree_id,
            level=test_tree.level,
            sort_order=test_tree.sort_order,

            is_active=test_tree.is_active,
            created_at=test_tree.created_at,
            updated_at=test_tree.updated_at,
            deactivated_at=test_tree.deactivated_at,
            children=children,
            children_count=len(children),
            has_children=len(children) > 0,
        )

