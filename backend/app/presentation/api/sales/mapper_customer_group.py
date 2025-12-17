"""API mapper for Sales module"""
from typing import List
from app.domain.sales.customer_group import CustomerGroup
from app.presentation.api.sales.schemas_customer_group import (
    CustomerGroupResponse,
    CustomerGroupTreeResponse,
)


class SalesApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def customer_group_to_response(customer_group: CustomerGroup) -> CustomerGroupResponse:
        return CustomerGroupResponse(
            id=customer_group.id,
            tenant_id=customer_group.tenant_id,
            code=customer_group.code,
            name=customer_group.name,
            parent_id=customer_group.parent_id,
            level=customer_group.level,
            sort_order=customer_group.sort_order,

            is_active=customer_group.is_active,
            created_at=customer_group.created_at,
            updated_at=customer_group.updated_at,
            deactivated_at=customer_group.deactivated_at,
        )

    @staticmethod
    def customer_group_tree_to_response(customer_group: CustomerGroup) -> CustomerGroupTreeResponse:
        """Convert CustomerGroup with children to CustomerGroupTreeResponse recursively"""
        children = [
            SalesApiMapper.customer_group_tree_to_response(child)
            for child in customer_group.children
        ]
        
        return CustomerGroupTreeResponse(
            id=customer_group.id,
            tenant_id=customer_group.tenant_id,
            code=customer_group.code,
            name=customer_group.name,
            parent_id=customer_group.parent_id,
            level=customer_group.level,
            sort_order=customer_group.sort_order,
            is_active=customer_group.is_active,
            created_at=customer_group.created_at,
            updated_at=customer_group.updated_at,
            deactivated_at=customer_group.deactivated_at,
            children=children,
            children_count=len(children),
            has_children=len(children) > 0,
        )

