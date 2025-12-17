"""API mapper for Sales module"""
from app.domain.sales.customer_type import CustomerType
from app.presentation.api.sales.schemas_customer_type import CustomerTypeResponse


class SalesApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def customer_type_to_response(customer_type: CustomerType) -> CustomerTypeResponse:
        return CustomerTypeResponse(
            id=customer_type.id,
            tenant_id=customer_type.tenant_id,
            code=customer_type.code,
            name=customer_type.name,

            is_active=customer_type.is_active,
            created_at=customer_type.created_at,
            updated_at=customer_type.updated_at,
        )

