"""
CustomerGroup mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.sales.customer_group import CustomerGroup
from app.infrastructure.shared.database.models import CustomerGroupModel


class CustomerGroupMapper:
    """Mapper for CustomerGroup entity to CustomerGroupModel conversion"""
    
    @staticmethod
    def to_domain(model: CustomerGroupModel) -> CustomerGroup:
        """Convert database model to domain entity
        
        Args:
            model: CustomerGroupModel from database
            
        Returns:
            CustomerGroup domain entity
        """
        return CustomerGroup(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            customer_group_id=model.id,
            parent_id=model.parent_id,
            level=model.level,
            sort_order=model.sort_order,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    @staticmethod
    def to_model(customer_group: CustomerGroup) -> CustomerGroupModel:
        """Convert domain entity to database model
        
        Args:
            customer_group: CustomerGroup domain entity
            
        Returns:
            CustomerGroupModel for database persistence
        """
        return CustomerGroupModel(
            id=customer_group.id,
            tenant_id=customer_group.tenant_id,
            code=customer_group.code,
            name=customer_group.name,
            parent_id=customer_group.parent_id,
            level=customer_group.level,
            sort_order=customer_group.sort_order,
            is_active=customer_group.is_active,
            version=customer_group.get_version(),
            created_at=customer_group.created_at,
            updated_at=customer_group.updated_at,
        )

