"""API mapper for Sales module"""
from app.domain.sales.test_basic import TestBasic
from app.presentation.api.sales.schemas_test_basic import TestBasicResponse


class SalesApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def test_basic_to_response(test_basic: TestBasic) -> TestBasicResponse:
        return TestBasicResponse(
            id=test_basic.id,
            tenant_id=test_basic.tenant_id,
            code=test_basic.code,
            name=test_basic.name,

            is_active=test_basic.is_active,
            created_at=test_basic.created_at,
            updated_at=test_basic.updated_at,
        )

