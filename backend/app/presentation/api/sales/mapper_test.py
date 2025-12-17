"""API mapper for Sales module"""
from app.domain.sales.test import Test
from app.presentation.api.sales.schemas_test import TestResponse


class SalesApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def test_to_response(test: Test) -> TestResponse:
        return TestResponse(
            id=test.id,
            tenant_id=test.tenant_id,
            code=test.code,
            name=test.name,

            is_active=test.is_active,
            created_at=test.created_at,
            updated_at=test.updated_at,
            deactivated_at=test.deactivated_at,
        )

