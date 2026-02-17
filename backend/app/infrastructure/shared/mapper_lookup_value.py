"""LookupValue mapper - conversion between domain and database model."""
from typing import Optional

from app.domain.shared.lookup_value import LookupValue
from app.infrastructure.shared.database.models import LookupValueModel
from app.infrastructure.shared.mapper import BaseMapper


class LookupValueMapper(BaseMapper[LookupValue, LookupValueModel]):
    """Mapper for LookupValue entity to LookupValueModel conversion."""

    def to_domain(self, model: LookupValueModel) -> Optional[LookupValue]:
        if not model:
            return None
        return LookupValue(
            tenant_id=model.tenant_id,
            type_code=model.type_code,
            code=model.code,
            name=model.name,
            lookup_id=model.id,
            sort_order=model.sort_order,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )

    def to_model(self, lookup: LookupValue) -> Optional[LookupValueModel]:
        if not lookup:
            return None
        return LookupValueModel(
            id=lookup.id,
            tenant_id=lookup.tenant_id,
            type_code=lookup.type_code,
            code=lookup.code,
            name=lookup.name,
            sort_order=lookup.sort_order,
            is_active=lookup.is_active,
            version=lookup.get_version(),
            created_at=lookup.created_at,
            updated_at=lookup.updated_at,
        )
