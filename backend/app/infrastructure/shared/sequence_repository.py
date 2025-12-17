"""SQLModel implementation of the sequence repository"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Callable

from sqlmodel import Session, select

from app.domain.shared.sequence import Sequence
from app.domain.shared.repositories import SequenceRepository
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.shared.database.models import SequenceModel


class SQLSequenceRepository(SequenceRepository):
    """SQLModel-based sequence persistence adapter"""

    def __init__(self, session_factory: Optional[Callable[[], Session]] = None):
        self._session_factory = session_factory if session_factory else get_session_sync

    def _to_domain(self, model: SequenceModel) -> Sequence:
        """Convert database model to domain aggregate"""
        return Sequence(
            tenant_id=model.tenant_id,
            sequence_type=model.sequence_type,
            prefix=model.prefix,
            digits=model.digits,
            current_value=model.current_value,
            description=model.description,
            sequence_id=model.id,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=0,  # Version tracking not implemented for sequences
        )

    def _to_model(self, sequence: Sequence) -> SequenceModel:
        """Convert domain aggregate to database model"""
        return SequenceModel(
            id=sequence.id,
            tenant_id=sequence.tenant_id,
            sequence_type=sequence.sequence_type,
            prefix=sequence.prefix,
            digits=sequence.digits,
            current_value=sequence.current_value,
            description=sequence.description,
            created_at=sequence.created_at,
            updated_at=sequence.updated_at,
        )

    async def get_by_type(
        self, tenant_id: str, sequence_type: str
    ) -> Optional[Sequence]:
        """Get sequence by type for a tenant"""
        with self._session_factory() as session:
            model = session.exec(
                select(SequenceModel).where(
                    SequenceModel.tenant_id == tenant_id,
                    SequenceModel.sequence_type == sequence_type.upper(),
                )
            ).first()

            if not model:
                return None

            return self._to_domain(model)

    async def get_or_create(
        self,
        tenant_id: str,
        sequence_type: str,
        prefix: str = "",
        digits: int = 6,
        description: Optional[str] = None,
    ) -> Sequence:
        """Get existing sequence or create a new one with default values"""
        with self._session_factory() as session:
            model = session.exec(
                select(SequenceModel).where(
                    SequenceModel.tenant_id == tenant_id,
                    SequenceModel.sequence_type == sequence_type.upper(),
                )
            ).first()

            if model:
                return self._to_domain(model)

            # Create new sequence
            sequence = Sequence(
                tenant_id=tenant_id,
                sequence_type=sequence_type,
                prefix=prefix,
                digits=digits,
                description=description,
            )
            model = self._to_model(sequence)
            session.add(model)
            session.commit()
            session.refresh(model)

            return self._to_domain(model)

    async def save(self, sequence: Sequence) -> Sequence:
        """Save or update a sequence"""
        with self._session_factory() as session:
            model = session.get(SequenceModel, sequence.id)

            if model:
                # Update existing
                model.tenant_id = sequence.tenant_id
                model.sequence_type = sequence.sequence_type
                model.prefix = sequence.prefix
                model.digits = sequence.digits
                model.current_value = sequence.current_value
                model.description = sequence.description
                model.updated_at = sequence.updated_at
            else:
                # Create new
                model = self._to_model(sequence)

            session.add(model)
            session.commit()
            session.refresh(model)

            return self._to_domain(model)

    async def get_next_value(
        self,
        tenant_id: str,
        sequence_type: str,
        prefix: str = "",
        digits: int = 6,
    ) -> str:
        """Get the next code value (thread-safe, increments counter)"""
        with self._session_factory() as session:
            # Use database-level locking for thread safety
            # SQLModel select doesn't support with_for_update directly, so we use SQLAlchemy select
            from sqlalchemy import select as sa_select
            stmt = sa_select(SequenceModel).where(
                SequenceModel.tenant_id == tenant_id,
                SequenceModel.sequence_type == sequence_type.upper(),
            ).with_for_update()  # Row-level lock for concurrent safety
            
            result = session.execute(stmt)
            model = result.scalar_one_or_none()

            if not model:
                # Create new sequence
                sequence = Sequence(
                    tenant_id=tenant_id,
                    sequence_type=sequence_type,
                    prefix=prefix,
                    digits=digits,
                )
                model = self._to_model(sequence)
                session.add(model)
                session.flush()  # Flush to get the ID

            # Increment and generate code
            model.current_value += 1
            model.updated_at = datetime.now(timezone.utc)
            
            number_str = str(model.current_value).zfill(model.digits)
            code = f"{model.prefix}{number_str}" if model.prefix else number_str

            session.add(model)
            session.commit()

            return code

