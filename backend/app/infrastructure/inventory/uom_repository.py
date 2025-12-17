"""
Unit of Measure repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional
from sqlmodel import Session, select, and_, or_
from sqlalchemy.exc import IntegrityError
from app.domain.inventory.repositories import UnitOfMeasureRepository
from app.infrastructure.shared.database.models import UnitOfMeasureModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError
from app.shared.utils import generate_id
from datetime import datetime, timezone


class SQLUnitOfMeasureRepository(UnitOfMeasureRepository):
    """SQLModel implementation of UnitOfMeasureRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._tenant_id = tenant_id
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    def _model_to_dict(self, model: UnitOfMeasureModel) -> dict:
        """Convert model to dict"""
        return {
            "id": model.id,
            "tenant_id": model.tenant_id,
            "code": model.code,
            "name": model.name,
            "base_uom": model.base_uom,
            "conversion_factor": float(model.conversion_factor),
            "created_at": model.created_at,
            "updated_at": model.updated_at,
        }
    
    async def save(self, uom_data: dict) -> dict:
        """Save or update a unit of measure"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            uom_id = uom_data.get("id")
            
            if uom_id:
                # Update existing
                statement = select(UnitOfMeasureModel).where(
                    UnitOfMeasureModel.id == uom_id,
                    UnitOfMeasureModel.tenant_id == tenant_id
                )
                existing_model = session.exec(statement).first()
                
                if not existing_model:
                    raise BusinessRuleError(f"Unit of measure with ID {uom_id} not found")
                
                # Check if code is being changed and if new code already exists
                if uom_data.get("code") and uom_data["code"] != existing_model.code:
                    code_check = select(UnitOfMeasureModel).where(
                        UnitOfMeasureModel.tenant_id == tenant_id,
                        UnitOfMeasureModel.code == uom_data["code"],
                        UnitOfMeasureModel.id != uom_id
                    )
                    if session.exec(code_check).first():
                        raise BusinessRuleError(f"Unit of measure with code {uom_data['code']} already exists")
                
                existing_model.code = uom_data.get("code", existing_model.code)
                existing_model.name = uom_data.get("name", existing_model.name)
                existing_model.base_uom = uom_data.get("base_uom", existing_model.base_uom)
                existing_model.conversion_factor = uom_data.get("conversion_factor", existing_model.conversion_factor)
                existing_model.updated_at = datetime.now(timezone.utc)
                
                session.add(existing_model)
                try:
                    session.commit()
                    session.refresh(existing_model)
                    return self._model_to_dict(existing_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update unit of measure: {str(e)}")
            else:
                # Create new
                code = uom_data["code"].strip().upper()
                
                # Check if code already exists
                code_check = select(UnitOfMeasureModel).where(
                    UnitOfMeasureModel.tenant_id == tenant_id,
                    UnitOfMeasureModel.code == code
                )
                if session.exec(code_check).first():
                    raise BusinessRuleError(f"Unit of measure with code {code} already exists")
                
                # Verify base UOM exists
                base_uom = uom_data["base_uom"].strip().upper()
                base_check = select(UnitOfMeasureModel).where(
                    UnitOfMeasureModel.tenant_id == tenant_id,
                    UnitOfMeasureModel.code == base_uom
                )
                if not session.exec(base_check).first() and base_uom != code:
                    raise BusinessRuleError(f"Base UOM {base_uom} does not exist")
                
                new_model = UnitOfMeasureModel(
                    id=generate_id(),
                    tenant_id=tenant_id,
                    code=code,
                    name=uom_data["name"],
                    base_uom=base_uom,
                    conversion_factor=uom_data["conversion_factor"],
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
                
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    return self._model_to_dict(new_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create unit of measure: {str(e)}")
    
    async def get_by_id(self, uom_id: str) -> Optional[dict]:
        """Get unit of measure by ID"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(UnitOfMeasureModel).where(
                UnitOfMeasureModel.id == uom_id,
                UnitOfMeasureModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._model_to_dict(model) if model else None
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[dict]:
        """Get unit of measure by code"""
        with self._session_factory() as session:
            statement = select(UnitOfMeasureModel).where(
                UnitOfMeasureModel.tenant_id == tenant_id,
                UnitOfMeasureModel.code == code.upper().strip()
            )
            model = session.exec(statement).first()
            return self._model_to_dict(model) if model else None
    
    async def get_all(
        self,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100,
        base_uom: Optional[str] = None
    ) -> List[dict]:
        """Get all units of measure with pagination"""
        with self._session_factory() as session:
            conditions = [UnitOfMeasureModel.tenant_id == tenant_id]
            
            if base_uom:
                conditions.append(UnitOfMeasureModel.base_uom == base_uom.upper().strip())
            
            statement = (
                select(UnitOfMeasureModel)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            return [self._model_to_dict(model) for model in models]
    
    async def search(
        self,
        tenant_id: str,
        query: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[dict]:
        """Search units of measure by code or name"""
        with self._session_factory() as session:
            search_term = f"%{query.upper()}%"
            statement = (
                select(UnitOfMeasureModel)
                .where(
                    and_(
                        UnitOfMeasureModel.tenant_id == tenant_id,
                        or_(
                            UnitOfMeasureModel.code.ilike(search_term),
                            UnitOfMeasureModel.name.ilike(search_term)
                        )
                    )
                )
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            return [self._model_to_dict(model) for model in models]
    
    async def delete(self, uom_id: str) -> bool:
        """Delete unit of measure by ID"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(UnitOfMeasureModel).where(
                UnitOfMeasureModel.id == uom_id,
                UnitOfMeasureModel.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            
            if not model:
                return False
            
            # TODO: Check if UOM is used by any items before deleting
            session.delete(model)
            try:
                session.commit()
                return True
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Cannot delete unit of measure: it may be in use. {str(e)}")

