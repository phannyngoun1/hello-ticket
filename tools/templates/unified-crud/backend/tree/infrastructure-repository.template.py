"""
{{EntityName}} repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional, Dict
from sqlmodel import Session, select, and_, or_
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from app.domain.{{moduleName}}.{{EntityNameLower}} import {{EntityName}}
from app.domain.{{moduleName}}.{{EntityNameLower}}_repositories import {{EntityName}}Repository, {{EntityName}}SearchResult
from app.infrastructure.shared.database.models import {{EntityName}}Model
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.{{moduleName}}.mapper_{{EntityNameLower}} import {{EntityName}}Mapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError


class SQL{{EntityName}}Repository({{EntityName}}Repository):
    """SQLModel implementation of {{EntityName}}Repository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._mapper = {{EntityName}}Mapper()
        self._tenant_id = tenant_id  # Override tenant context if provided
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, {{EntityNameLower}}: {{EntityName}}) -> {{EntityName}}:
        """Save or update a {{EntityNameLower}}"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            # Check if {{EntityNameLower}} exists (within tenant scope)
            statement = select({{EntityName}}Model).where(
                {{EntityName}}Model.id == {{EntityNameLower}}.id,
                {{EntityName}}Model.tenant_id == tenant_id
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                # Update existing {{EntityNameLower}}
                # Use merge with a new model instance to ensure proper change tracking
                updated_model = self._mapper.to_model({{EntityNameLower}})
                # Merge will update the existing model in the session
                merged_model = session.merge(updated_model)
                try:
                    session.commit()
                    session.refresh(merged_model)
                    return self._mapper.to_domain(merged_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update {{EntityNameLower}}: {str(e)}")
            else:
                # Create new {{EntityNameLower}}
                new_model = self._mapper.to_model({{EntityNameLower}})
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    return self._mapper.to_domain(new_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create {{EntityNameLower}}: {str(e)}")
    
    async def get_by_id(self, tenant_id: str, {{EntityNameLower}}_id: str) -> Optional[{{EntityName}}]:
        """Get {{EntityNameLower}} by ID (within tenant scope)"""
        with self._session_factory() as session:
            statement = select({{EntityName}}Model).where(
                {{EntityName}}Model.id == {{EntityNameLower}}_id,
                {{EntityName}}Model.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[{{EntityName}}]:
        """Get {{EntityNameLower}} by business code"""
        if not code or not code.strip():
            return None
        with self._session_factory() as session:
            statement = select({{EntityName}}Model).where(
                {{EntityName}}Model.tenant_id == tenant_id,
                {{EntityName}}Model.code == code.strip().upper()
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        include_deleted: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> {{EntityName}}SearchResult:
        """Search {{EntityNamePluralLower}} by term and status"""
        with self._session_factory() as session:
            conditions = [{{EntityName}}Model.tenant_id == tenant_id]
            
            # Exclude deleted records by default
            if not include_deleted:
                conditions.append({{EntityName}}Model.is_deleted == False)
            
            if search:
                search_term = f"%{search}%"
                conditions.append(
                    or_(
                        {{EntityName}}Model.code.ilike(search_term),
                        {{EntityName}}Model.name.ilike(search_term)
                    )
                )
            
            if is_active is not None:
                conditions.append({{EntityName}}Model.is_active == is_active)
            
            # Count total
            count_statement = select({{EntityName}}Model).where(and_(*conditions))
            all_models = session.exec(count_statement).all()
            total = len(all_models)
            
            # Get paginated results
            statement = (
                select({{EntityName}}Model)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            
            items = [self._mapper.to_domain(model) for model in models]
            has_next = skip + limit < total
            
            return {{EntityName}}SearchResult(items=items, total=total, has_next=has_next)
    
    async def get_children(self, parent_{{EntityNameLower}}_id: str) -> List[{{EntityName}}]:
        """Get all direct children of a {{EntityNameLower}}"""
        tenant_id = self._get_tenant_id()

        with self._session_factory() as session:
            statement = (
                select({{EntityName}}Model)
                .where(
                    and_(
                        {{EntityName}}Model.tenant_id == tenant_id,
                        {{EntityName}}Model.parent_{{EntityNameLower}}_id
                        == parent_{{EntityNameLower}}_id,
                        {{EntityName}}Model.is_deleted == False,
                    )
                )
                .order_by({{EntityName}}Model.sort_order, {{EntityName}}Model.name)
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]

    async def get_descendants(self, {{EntityNameLower}}_id: str) -> List[{{EntityName}}]:
        """Get all descendants of a {{EntityNameLower}} (recursive)"""
        tenant_id = self._get_tenant_id()

        with self._session_factory() as session:
            query = text(
                """
                WITH RECURSIVE group_path AS (
                    SELECT id, tenant_id, code, name, parent_{{EntityNameLower}}_id,
                           level, sort_order, is_active, is_deleted, version,
                           created_at, updated_at, deleted_at
                    FROM {{EntityNamePluralSnake}}
                    WHERE parent_{{EntityNameLower}}_id = :group_id
                      AND tenant_id = :tenant_id
                      AND is_deleted = FALSE

                    UNION ALL

                    SELECT cg.id, cg.tenant_id, cg.code, cg.name, cg.parent_{{EntityNameLower}}_id,
                           cg.level, cg.sort_order, cg.is_active, cg.is_deleted, cg.version,
                           cg.created_at, cg.updated_at, cg.deleted_at
                    FROM {{EntityNamePluralSnake}} cg
                    INNER JOIN group_path gp ON cg.parent_{{EntityNameLower}}_id = gp.id
                    WHERE cg.tenant_id = :tenant_id
                      AND cg.is_deleted = FALSE
                )
                SELECT * FROM group_path
                ORDER BY level, sort_order, name
                """
            )

            result = session.execute(
                query, {"group_id": {{EntityNameLower}}_id, "tenant_id": tenant_id}
            )

            descendants: List[{{EntityName}}] = []
            for row in result:
                model = {{EntityName}}Model(
                    id=row.id,
                    tenant_id=row.tenant_id,
                    code=row.code,
                    name=row.name,
                    parent_{{EntityNameLower}}_id=row.parent_{{EntityNameLower}}_id,
                    level=row.level,
                    sort_order=row.sort_order,
                    is_active=row.is_active,
                    is_deleted=row.is_deleted,
                    version=row.version,
                    created_at=row.created_at,
                    updated_at=row.updated_at,
                    deleted_at=row.deleted_at,
                )
                descendants.append(self._mapper.to_domain(model))
            return descendants

    async def get_ancestors(self, {{EntityNameLower}}_id: str) -> List[{{EntityName}}]:
        """Get all ancestors of a {{EntityNameLower}} (up to root)"""
        tenant_id = self._get_tenant_id()

        with self._session_factory() as session:
            query = text(
                """
                WITH RECURSIVE group_path AS (
                    SELECT id, tenant_id, code, name, parent_{{EntityNameLower}}_id,
                           level, sort_order, is_active, is_deleted, version,
                           created_at, updated_at, deleted_at
                    FROM {{EntityNamePluralSnake}}
                    WHERE id = :group_id
                      AND tenant_id = :tenant_id

                    UNION ALL

                    SELECT cg.id, cg.tenant_id, cg.code, cg.name, cg.parent_{{EntityNameLower}}_id,
                           cg.level, cg.sort_order, cg.is_active, cg.is_deleted, cg.version,
                           cg.created_at, cg.updated_at, cg.deleted_at
                    FROM {{EntityNamePluralSnake}} cg
                    INNER JOIN group_path gp ON cg.id = gp.parent_{{EntityNameLower}}_id
                    WHERE cg.tenant_id = :tenant_id
                )
                SELECT *
                FROM group_path
                WHERE id != :group_id
                ORDER BY level DESC
                """
            )

            result = session.execute(
                query, {"group_id": {{EntityNameLower}}_id, "tenant_id": tenant_id}
            )

            ancestors: List[{{EntityName}}] = []
            for row in result:
                model = {{EntityName}}Model(
                    id=row.id,
                    tenant_id=row.tenant_id,
                    code=row.code,
                    name=row.name,
                    parent_{{EntityNameLower}}_id=row.parent_{{EntityNameLower}}_id,
                    level=row.level,
                    sort_order=row.sort_order,
                    is_active=row.is_active,
                    is_deleted=row.is_deleted,
                    version=row.version,
                    created_at=row.created_at,
                    updated_at=row.updated_at,
                    deleted_at=row.deleted_at,
                )
                ancestors.append(self._mapper.to_domain(model))
            return ancestors

    async def get_root_{{EntityNamePluralLower}}(self, tenant_id: str) -> List[{{EntityName}}]:
        """Get all root {{EntityNamePluralLower}} (no parent)"""

        with self._session_factory() as session:
            statement = (
                select({{EntityName}}Model)
                .where(
                    and_(
                        {{EntityName}}Model.tenant_id == tenant_id,
                        {{EntityName}}Model.parent_{{EntityNameLower}}_id.is_(None),
                        {{EntityName}}Model.is_deleted == False,
                    )
                )
                .order_by({{EntityName}}Model.sort_order, {{EntityName}}Model.name)
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]

    async def get_all(
        self,
        tenant_id: str,
        parent_{{EntityNameLower}}_id: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[{{EntityName}}]:
        """Get all {{EntityNamePluralLower}} with filters"""
        with self._session_factory() as session:
            conditions = [
                {{EntityName}}Model.tenant_id == tenant_id,
                {{EntityName}}Model.is_deleted == False,
            ]

            if parent_{{EntityNameLower}}_id is not None:
                if parent_{{EntityNameLower}}_id == "":
                    parent_{{EntityNameLower}}_id = None
                if parent_{{EntityNameLower}}_id is None:
                    conditions.append(
                        {{EntityName}}Model.parent_{{EntityNameLower}}_id.is_(None)
                    )
                else:
                    conditions.append(
                        {{EntityName}}Model.parent_{{EntityNameLower}}_id
                        == parent_{{EntityNameLower}}_id
                    )

            if is_active is not None:
                conditions.append({{EntityName}}Model.is_active == is_active)

            statement = (
                select({{EntityName}}Model)
                .where(and_(*conditions))
                .order_by({{EntityName}}Model.sort_order, {{EntityName}}Model.name)
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]

    async def get_{{EntityNameLower}}_tree(self, tenant_id: str) -> List[{{EntityName}}]:
        """Get full {{EntityNameLower}} tree with hierarchy"""
        with self._session_factory() as session:
            statement = (
                select({{EntityName}}Model)
                .where(
                    and_(
                        {{EntityName}}Model.tenant_id == tenant_id,
                        {{EntityName}}Model.is_deleted == False,
                    )
                )
                .order_by({{EntityName}}Model.level, {{EntityName}}Model.sort_order)
            )
            models = session.exec(statement).all()

        node_map: Dict[str, {{EntityName}}] = {}
        for model in models:
            node_map[model.id] = self._mapper.to_domain(model)

        roots: List[{{EntityName}}] = []
        for model in models:
            node = node_map[model.id]
            parent_id = model.parent_{{EntityNameLower}}_id
            if parent_id and parent_id in node_map:
                node_map[parent_id].add_child(node)
            else:
                roots.append(node)

        for node in node_map.values():
            if node.children:
                node.children.sort(key=lambda child: (child.sort_order, child.name))
        roots.sort(key=lambda root: (root.sort_order, root.name))
        return roots
    
    async def delete(self, tenant_id: str, {{EntityNameLower}}_id: str, hard_delete: bool = False) -> bool:
        """Delete a {{EntityNameLower}} (soft-delete by default, hard-delete if specified)"""
        with self._session_factory() as session:
            statement = select({{EntityName}}Model).where(
                {{EntityName}}Model.id == {{EntityNameLower}}_id,
                {{EntityName}}Model.tenant_id == tenant_id
            )
            model = session.exec(statement).first()
            if not model:
                return False
            
            if hard_delete:
                # Hard delete: permanently remove from database
                session.delete(model)
            else:
                # Soft delete: mark as deleted
                from datetime import datetime, timezone
                model.is_deleted = True
                model.deleted_at = datetime.now(timezone.utc)
                model.updated_at = datetime.now(timezone.utc)
                # Model is already in session from .first(), SQLAlchemy tracks changes automatically
            
            try:
                session.commit()
                return True
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to delete {{EntityNameLower}}: {str(e)}")

