"""
Serial repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_
from sqlalchemy.exc import IntegrityError
from app.domain.inventory.serial import Serial
from app.domain.inventory.repositories import SerialRepository
from app.infrastructure.shared.database.models import SerialModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.inventory.mapper import SerialMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError


class SQLSerialRepository(SerialRepository):
    """SQLModel implementation of SerialRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._mapper = SerialMapper()
        self._tenant_id = tenant_id  # Override tenant context if provided
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, serial: Serial) -> Serial:
        """Save or update a serial"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if serial exists (within tenant scope)
            statement = select(SerialModel).where(
                SerialModel.id == serial.id,
                SerialModel.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                # Update existing serial
                existing_model.serial_number = serial.serial_number
                existing_model.status = serial.status.value
                session.add(existing_model)
                try:
                    session.commit()
                    session.refresh(existing_model)
                    return self._mapper.to_domain(existing_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update serial: {str(e)}")
            else:
                # Create new serial
                new_model = self._mapper.to_model(serial)
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    return self._mapper.to_domain(new_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create serial: {str(e)}")
    
    async def get_by_id(self, serial_id: str) -> Optional[Serial]:
        """Get serial by ID (within tenant scope)"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(SerialModel).where(
                SerialModel.id == serial_id,
                SerialModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_serial_number(
        self,
        tenant_id: str,
        item_id: str,
        serial_number: str
    ) -> Optional[Serial]:
        """Get serial by serial number"""
        with self._session_factory() as session:
            statement = select(SerialModel).where(
                SerialModel.tenant_id == tenant_id,
                SerialModel.item_id == item_id,
                SerialModel.serial_number == serial_number
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_item(
        self,
        tenant_id: str,
        item_id: str
    ) -> List[Serial]:
        """Get all serials for an item"""
        with self._session_factory() as session:
            statement = select(SerialModel).where(
                SerialModel.tenant_id == tenant_id,
                SerialModel.item_id == item_id
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]

