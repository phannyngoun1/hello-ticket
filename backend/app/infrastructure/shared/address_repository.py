"""SQLModel implementation of unified address repositories"""
from __future__ import annotations

from typing import List, Optional

from sqlmodel import Session, and_, select, func

from app.domain.shared.address import Address
from app.domain.shared.address_assignment import AddressAssignment
from app.domain.shared.repositories import AddressRepository, AddressAssignmentRepository
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.shared.database.models import AddressModel, AddressAssignmentModel


class AddressMapper:
    """Convert between address domain objects and SQL models"""

    def to_domain(self, model: AddressModel) -> Address:
        return Address(
            tenant_id=model.tenant_id,
            street=model.street,
            city=model.city,
            state=model.state,
            postal_code=model.postal_code,
            country=model.country,
            name=model.name,
            notes=model.notes,
            address_id=model.id,
            version=model.version,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def to_model(self, address: Address) -> AddressModel:
        return AddressModel(
            id=address.id,
            tenant_id=address.tenant_id,
            name=address.name,
            street=address.street,
            city=address.city,
            state=address.state,
            postal_code=address.postal_code,
            country=address.country,
            notes=address.notes,
            version=address.get_version(),
            created_at=address.created_at,
            updated_at=address.updated_at,
        )

    def apply_to_model(self, address: Address, model: AddressModel) -> None:
        model.name = address.name
        model.street = address.street
        model.city = address.city
        model.state = address.state
        model.postal_code = address.postal_code
        model.country = address.country
        model.notes = address.notes
        model.version = address.get_version()
        model.updated_at = address.updated_at


class AddressAssignmentMapper:
    """Convert between address assignment domain objects and SQL models"""

    def to_domain(self, model: AddressAssignmentModel) -> AddressAssignment:
        return AddressAssignment(
            tenant_id=model.tenant_id,
            address_id=model.address_id,
            entity_type=model.entity_type,
            entity_id=model.entity_id,
            address_type=model.address_type,
            is_primary=model.is_primary,
            assignment_id=model.id,
            version=model.version,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def to_model(self, assignment: AddressAssignment) -> AddressAssignmentModel:
        return AddressAssignmentModel(
            id=assignment.id,
            tenant_id=assignment.tenant_id,
            address_id=assignment.address_id,
            entity_type=assignment.entity_type,
            entity_id=assignment.entity_id,
            address_type=assignment.address_type,
            is_primary=assignment.is_primary,
            version=assignment.get_version(),
            created_at=assignment.created_at,
            updated_at=assignment.updated_at,
        )

    def apply_to_model(self, assignment: AddressAssignment, model: AddressAssignmentModel) -> None:
        model.address_id = assignment.address_id
        model.entity_type = assignment.entity_type
        model.entity_id = assignment.entity_id
        model.address_type = assignment.address_type
        model.is_primary = assignment.is_primary
        model.version = assignment.get_version()
        model.updated_at = assignment.updated_at


class SQLAddressRepository(AddressRepository):
    """SQLModel-based address persistence adapter"""

    def __init__(self, session_factory: Optional[Session] = None):
        self._session_factory = session_factory if session_factory else get_session_sync
        self._mapper = AddressMapper()

    async def save(self, address: Address) -> Address:
        with self._session_factory() as session:
            model = session.get(AddressModel, address.id)

            if model:
                self._mapper.apply_to_model(address, model)
            else:
                model = self._mapper.to_model(address)
            session.add(model)
            session.commit()
            session.refresh(model)

        return self._mapper.to_domain(model)

    async def get_by_id(self, tenant_id: str, address_id: str) -> Optional[Address]:
        with self._session_factory() as session:
            model = session.exec(
                select(AddressModel).where(
                    AddressModel.id == address_id,
                    AddressModel.tenant_id == tenant_id,
                )
            ).first()
            if not model:
                return None
            return self._mapper.to_domain(model)

    async def list(
        self,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Address]:
        with self._session_factory() as session:
            statement = (
                select(AddressModel)
                .where(AddressModel.tenant_id == tenant_id)
                .offset(skip)
                .limit(limit)
                .order_by(AddressModel.created_at.desc())
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]

    async def find_by_fields(
        self,
        tenant_id: str,
        street: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        postal_code: Optional[str] = None,
        country: Optional[str] = None,
    ) -> Optional[Address]:
        """Find an existing address by its fields (SAP-style reuse).
        
        Matches addresses where all provided fields match exactly (case-insensitive, trimmed).
        Only fields that are provided (not None) are used in the match.
        """
        with self._session_factory() as session:
            conditions = [AddressModel.tenant_id == tenant_id]
            
            # Only match on fields that are provided
            if street is not None:
                street_normalized = street.strip().lower() if street else ""
                conditions.append(
                    func.lower(func.trim(func.coalesce(AddressModel.street, ""))) == street_normalized
                )
            
            if city is not None:
                city_normalized = city.strip().lower() if city else ""
                conditions.append(
                    func.lower(func.trim(func.coalesce(AddressModel.city, ""))) == city_normalized
                )
            
            if state is not None:
                state_normalized = state.strip().lower() if state else ""
                conditions.append(
                    func.lower(func.trim(func.coalesce(AddressModel.state, ""))) == state_normalized
                )
            
            if postal_code is not None:
                postal_normalized = postal_code.strip().lower() if postal_code else ""
                conditions.append(
                    func.lower(func.trim(func.coalesce(AddressModel.postal_code, ""))) == postal_normalized
                )
            
            if country is not None:
                country_normalized = country.strip().lower() if country else ""
                conditions.append(
                    func.lower(func.trim(func.coalesce(AddressModel.country, ""))) == country_normalized
                )
            
            # Only search if at least one field is provided
            if len(conditions) == 1:  # Only tenant_id condition
                return None
            
            model = session.exec(
                select(AddressModel).where(and_(*conditions))
            ).first()
            
            if not model:
                return None
            return self._mapper.to_domain(model)

    async def delete(self, tenant_id: str, address_id: str) -> bool:
        with self._session_factory() as session:
            model = session.exec(
                select(AddressModel).where(
                    AddressModel.id == address_id,
                    AddressModel.tenant_id == tenant_id,
                )
            ).first()
            if not model:
                return False
            session.delete(model)
            session.commit()
            return True


class SQLAddressAssignmentRepository(AddressAssignmentRepository):
    """SQLModel-based address assignment persistence adapter"""

    def __init__(self, session_factory: Optional[Session] = None):
        self._session_factory = session_factory if session_factory else get_session_sync
        self._mapper = AddressAssignmentMapper()

    async def save(self, assignment: AddressAssignment) -> AddressAssignment:
        with self._session_factory() as session:
            model = session.get(AddressAssignmentModel, assignment.id)

            if model:
                self._mapper.apply_to_model(assignment, model)
            else:
                model = self._mapper.to_model(assignment)
            session.add(model)
            session.commit()
            session.refresh(model)

        return self._mapper.to_domain(model)

    async def get_by_id(self, tenant_id: str, assignment_id: str) -> Optional[AddressAssignment]:
        with self._session_factory() as session:
            model = session.exec(
                select(AddressAssignmentModel).where(
                    AddressAssignmentModel.id == assignment_id,
                    AddressAssignmentModel.tenant_id == tenant_id,
                )
            ).first()
            if not model:
                return None
            return self._mapper.to_domain(model)

    async def get_by_address_and_entity(
        self,
        tenant_id: str,
        address_id: str,
        entity_type: str,
        entity_id: str,
        address_type: Optional[str] = None,
    ) -> Optional[AddressAssignment]:
        with self._session_factory() as session:
            conditions = [
                AddressAssignmentModel.tenant_id == tenant_id,
                AddressAssignmentModel.address_id == address_id,
                AddressAssignmentModel.entity_type == entity_type,
                AddressAssignmentModel.entity_id == entity_id,
            ]
            if address_type:
                conditions.append(AddressAssignmentModel.address_type == address_type)

            model = session.exec(
                select(AddressAssignmentModel).where(and_(*conditions))
            ).first()
            if not model:
                return None
            return self._mapper.to_domain(model)

    async def list_by_entity(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
        address_type: Optional[str] = None,
    ) -> List[AddressAssignment]:
        with self._session_factory() as session:
            conditions = [
                AddressAssignmentModel.tenant_id == tenant_id,
                AddressAssignmentModel.entity_type == entity_type,
                AddressAssignmentModel.entity_id == entity_id,
            ]
            if address_type:
                conditions.append(AddressAssignmentModel.address_type == address_type)

            statement = (
                select(AddressAssignmentModel)
                .where(and_(*conditions))
                .order_by(
                    AddressAssignmentModel.is_primary.desc(),
                    AddressAssignmentModel.created_at.desc()
                )
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]

    async def list_by_address(
        self,
        tenant_id: str,
        address_id: str,
    ) -> List[AddressAssignment]:
        with self._session_factory() as session:
            statement = (
                select(AddressAssignmentModel)
                .where(
                    AddressAssignmentModel.tenant_id == tenant_id,
                    AddressAssignmentModel.address_id == address_id,
                )
                .order_by(AddressAssignmentModel.created_at.desc())
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]

    async def get_primary(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
        address_type: str,
    ) -> Optional[AddressAssignment]:
        with self._session_factory() as session:
            model = session.exec(
                select(AddressAssignmentModel).where(
                    AddressAssignmentModel.tenant_id == tenant_id,
                    AddressAssignmentModel.entity_type == entity_type,
                    AddressAssignmentModel.entity_id == entity_id,
                    AddressAssignmentModel.address_type == address_type,
                    AddressAssignmentModel.is_primary == True,
                )
            ).first()
            if not model:
                return None
            return self._mapper.to_domain(model)

    async def delete(self, tenant_id: str, assignment_id: str) -> bool:
        with self._session_factory() as session:
            model = session.exec(
                select(AddressAssignmentModel).where(
                    AddressAssignmentModel.id == assignment_id,
                    AddressAssignmentModel.tenant_id == tenant_id,
                )
            ).first()
            if not model:
                return False
            session.delete(model)
            session.commit()
            return True

    async def delete_by_address_and_entity(
        self,
        tenant_id: str,
        address_id: str,
        entity_type: str,
        entity_id: str,
        address_type: Optional[str] = None,
    ) -> bool:
        with self._session_factory() as session:
            conditions = [
                AddressAssignmentModel.tenant_id == tenant_id,
                AddressAssignmentModel.address_id == address_id,
                AddressAssignmentModel.entity_type == entity_type,
                AddressAssignmentModel.entity_id == entity_id,
            ]
            if address_type:
                conditions.append(AddressAssignmentModel.address_type == address_type)

            models = session.exec(
                select(AddressAssignmentModel).where(and_(*conditions))
            ).all()
            if not models:
                return False
            for model in models:
                session.delete(model)
            session.commit()
            return True

