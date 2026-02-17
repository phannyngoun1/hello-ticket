"""LookupValue repository implementation."""
from typing import Optional

from sqlmodel import Session, select, and_, or_
from app.domain.shared.lookup_value import LookupValue
from app.domain.shared.lookup_value_repositories import LookupRepository, LookupSearchResult
from app.infrastructure.shared.database.models import LookupValueModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.shared.mapper_lookup_value import LookupValueMapper
from app.infrastructure.shared.repository import BaseSQLRepository


class SQLLookupRepository(BaseSQLRepository[LookupValue, LookupValueModel], LookupRepository):
    """SQLModel implementation of LookupRepository."""

    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        super().__init__(
            model_cls=LookupValueModel,
            mapper=LookupValueMapper(),
            session_factory=session,
            tenant_id=tenant_id,
        )

    async def get_by_id(
        self, tenant_id: str, lookup_id: str, type_code: str
    ) -> Optional[LookupValue]:
        if not lookup_id or not lookup_id.strip():
            return None
        with self._session_factory() as session:
            statement = select(LookupValueModel).where(
                LookupValueModel.tenant_id == tenant_id,
                LookupValueModel.id == lookup_id.strip(),
                LookupValueModel.type_code == type_code,
                LookupValueModel.is_deleted == False,
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None

    async def get_by_code(
        self, tenant_id: str, code: str, type_code: str
    ) -> Optional[LookupValue]:
        if not code or not code.strip():
            return None
        with self._session_factory() as session:
            statement = select(LookupValueModel).where(
                LookupValueModel.tenant_id == tenant_id,
                LookupValueModel.type_code == type_code,
                LookupValueModel.code == code.strip().upper(),
                LookupValueModel.is_deleted == False,
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None

    async def search(
        self,
        tenant_id: str,
        type_code: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        include_deleted: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> LookupSearchResult:
        with self._session_factory() as session:
            conditions = [
                LookupValueModel.tenant_id == tenant_id,
                LookupValueModel.type_code == type_code,
            ]
            if not include_deleted:
                conditions.append(LookupValueModel.is_deleted == False)
            if search:
                search_term = f"%{search}%"
                conditions.append(
                    or_(
                        LookupValueModel.code.ilike(search_term),
                        LookupValueModel.name.ilike(search_term),
                    )
                )
            if is_active is not None:
                conditions.append(LookupValueModel.is_active == is_active)

            count_statement = select(LookupValueModel).where(and_(*conditions))
            all_models = session.exec(count_statement).all()
            total = len(all_models)

            statement = (
                select(LookupValueModel)
                .where(and_(*conditions))
                .order_by(LookupValueModel.sort_order, LookupValueModel.code)
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            items = [self._mapper.to_domain(model) for model in models]
            has_next = skip + limit < total
            return LookupSearchResult(items=items, total=total, has_next=has_next)

    async def delete(
        self, tenant_id: str, lookup_id: str, type_code: str, hard_delete: bool = False
    ) -> bool:
        with self._session_factory() as session:
            statement = select(LookupValueModel).where(
                LookupValueModel.tenant_id == tenant_id,
                LookupValueModel.id == lookup_id,
                LookupValueModel.type_code == type_code,
            )
            model = session.exec(statement).first()
            if not model:
                return False

            if hard_delete:
                session.delete(model)
            else:
                model.is_deleted = True
                from datetime import datetime, timezone
                model.deleted_at = datetime.now(timezone.utc)
                model.updated_at = datetime.now(timezone.utc)

            session.commit()
            return True
