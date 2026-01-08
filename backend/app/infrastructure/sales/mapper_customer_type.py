"""
CustomerType mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.sales.customer_type import CustomerType
from app.infrastructure.shared.database.models import CustomerTypeModel
from app.infrastructure.shared.mapper import BaseMapper


class CustomerTypeMapper(BaseMapper[CustomerType, CustomerTypeModel]):
    """Mapper for CustomerType entity to CustomerTypeModel conversion"""
    
    def to_domain(self, model: CustomerTypeModel) -> Optional[CustomerType]:
        """Convert database model to domain entity
        
        Args:
            model: CustomerTypeModel from database
            
        Returns:
            CustomerType domain entity
        """
        if not model:
            return None
        return CustomerType(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            customer_type_id=model.id,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    def to_model(self, customer_type: CustomerType) -> Optional[CustomerTypeModel]:
        """Convert domain entity to database model
        
        Args:
            customer_type: CustomerType domain entity
            
        Returns:
            CustomerTypeModel for database persistence
        """
        if not customer_type:
            return None
        return CustomerTypeModel(
            id=customer_type.id,
            tenant_id=customer_type.tenant_id,
            code=customer_type.code,
            name=customer_type.name,
            is_active=customer_type.is_active,
            version=customer_type.get_version(),
            created_at=customer_type.created_at,
            updated_at=customer_type.updated_at,
        )

