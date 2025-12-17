"""API mapper for sales module"""
from app.domain.sales.customer import Customer
from app.presentation.api.sales.schemas import CustomerResponse


class SalesApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def customer_to_response(customer: Customer) -> CustomerResponse:
        return CustomerResponse(
            id=customer.id,
            tenant_id=customer.tenant_id,
            code=customer.code,
            name=customer.name,
            is_active=customer.is_active,
            created_at=customer.created_at,
            updated_at=customer.updated_at,
            deactivated_at=customer.deactivated_at,
        )
