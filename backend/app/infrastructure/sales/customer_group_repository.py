"""
CustomerGroup repository implementation - Adapter in Hexagonal Architecture
"""
from typing import List, Optional, Dict
from sqlmodel import Session, select, and_, or_
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from app.domain.sales.customer_group import CustomerGroup
from app.domain.sales.customer_group_repositories import CustomerGroupRepository, CustomerGroupSearchResult
from app.infrastructure.shared.database.models import CustomerGroupModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.sales.mapper_customer_group import CustomerGroupMapper
from app.infrastructure.shared.repository import BaseSQLRepository
from app.shared.exceptions import BusinessRuleError


class SQLCustomerGroupRepository(BaseSQLRepository[CustomerGroup, CustomerGroupModel], CustomerGroupRepository):
    """SQLModel implementation of CustomerGroupRepository using BaseSQLRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        super().__init__(
            model_cls=CustomerGroupModel, 
            mapper=CustomerGroupMapper(), 
            session_factory=session, 
            tenant_id=tenant_id
        )
    
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[CustomerGroup]:
        """Get customer_group by business code"""
        if not code or not code.strip():
            return None
        with self._session_factory() as session:
            statement = select(CustomerGroupModel).where(
                CustomerGroupModel.tenant_id == tenant_id,
                CustomerGroupModel.code == code.strip().upper()
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
    ) -> CustomerGroupSearchResult:
        """Search customer_groups by term and status"""
        with self._session_factory() as session:
            conditions = [CustomerGroupModel.tenant_id == tenant_id]
            
            # Exclude deleted records by default
            if not include_deleted:
                conditions.append(CustomerGroupModel.is_deleted == False)
            
            if search:
                search_term = f"%{search}%"
                conditions.append(
                    or_(
                        CustomerGroupModel.code.ilike(search_term),
                        CustomerGroupModel.name.ilike(search_term)
                    )
                )
            
            if is_active is not None:
                conditions.append(CustomerGroupModel.is_active == is_active)
            
            # Count total
            count_statement = select(CustomerGroupModel).where(and_(*conditions))
            all_models = session.exec(count_statement).all()
            total = len(all_models)
            
            # Get paginated results
            statement = (
                select(CustomerGroupModel)
                .where(and_(*conditions))
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            
            items = [self._mapper.to_domain(model) for model in models]
            has_next = skip + limit < total
            
            return CustomerGroupSearchResult(items=items, total=total, has_next=has_next)
    
    async def get_children(self, parent_id: str) -> List[CustomerGroup]:
        """Get all direct children of a customer_group"""
        tenant_id = self._get_tenant_id()

        with self._session_factory() as session:
            statement = (
                select(CustomerGroupModel)
                .where(
                    and_(
                        CustomerGroupModel.tenant_id == tenant_id,
                        CustomerGroupModel.parent_id
                        == parent_id,
                        CustomerGroupModel.is_deleted == False,
                    )
                )
                .order_by(CustomerGroupModel.sort_order, CustomerGroupModel.name)
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]

    async def get_descendants(self, customer_group_id: str) -> List[CustomerGroup]:
        """Get all descendants of a customer_group (recursive)"""
        tenant_id = self._get_tenant_id()

        with self._session_factory() as session:
            query = text(
                """
                WITH RECURSIVE group_path AS (
                    SELECT id, tenant_id, code, name, parent_id,
                           level, sort_order, is_active, is_deleted, version,
                           created_at, updated_at, deleted_at
                    FROM customer_groups
                    WHERE parent_id = :group_id
                      AND tenant_id = :tenant_id
                      AND is_deleted = FALSE

                    UNION ALL

                    SELECT cg.id, cg.tenant_id, cg.code, cg.name, cg.parent_id,
                           cg.level, cg.sort_order, cg.is_active, cg.is_deleted, cg.version,
                           cg.created_at, cg.updated_at, cg.deleted_at
                    FROM customer_groups cg
                    INNER JOIN group_path gp ON cg.parent_id = gp.id
                    WHERE cg.tenant_id = :tenant_id
                      AND cg.is_deleted = FALSE
                )
                SELECT * FROM group_path
                ORDER BY level, sort_order, name
                """
            )

            result = session.execute(
                query, {"group_id": customer_group_id, "tenant_id": tenant_id}
            )

            descendants: List[CustomerGroup] = []
            for row in result:
                model = CustomerGroupModel(
                    id=row.id,
                    tenant_id=row.tenant_id,
                    code=row.code,
                    name=row.name,
                    parent_id=row.parent_id,
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

    async def get_ancestors(self, customer_group_id: str) -> List[CustomerGroup]:
        """Get all ancestors of a customer_group (up to root)"""
        tenant_id = self._get_tenant_id()

        with self._session_factory() as session:
            query = text(
                """
                WITH RECURSIVE group_path AS (
                    SELECT id, tenant_id, code, name, parent_id,
                           level, sort_order, is_active, is_deleted, version,
                           created_at, updated_at, deleted_at
                    FROM customer_groups
                    WHERE id = :group_id
                      AND tenant_id = :tenant_id

                    UNION ALL

                    SELECT cg.id, cg.tenant_id, cg.code, cg.name, cg.parent_id,
                           cg.level, cg.sort_order, cg.is_active, cg.is_deleted, cg.version,
                           cg.created_at, cg.updated_at, cg.deleted_at
                    FROM customer_groups cg
                    INNER JOIN group_path gp ON cg.id = gp.parent_id
                    WHERE cg.tenant_id = :tenant_id
                )
                SELECT *
                FROM group_path
                WHERE id != :group_id
                ORDER BY level DESC
                """
            )

            result = session.execute(
                query, {"group_id": customer_group_id, "tenant_id": tenant_id}
            )

            ancestors: List[CustomerGroup] = []
            for row in result:
                model = CustomerGroupModel(
                    id=row.id,
                    tenant_id=row.tenant_id,
                    code=row.code,
                    name=row.name,
                    parent_id=row.parent_id,
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

    async def get_root_customer_groups(self, tenant_id: str) -> List[CustomerGroup]:
        """Get all root customer_groups (no parent)"""

        with self._session_factory() as session:
            statement = (
                select(CustomerGroupModel)
                .where(
                    and_(
                        CustomerGroupModel.tenant_id == tenant_id,
                        CustomerGroupModel.parent_id.is_(None),
                        CustomerGroupModel.is_deleted == False,
                    )
                )
                .order_by(CustomerGroupModel.sort_order, CustomerGroupModel.name)
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]

    async def get_all(
        self,
        tenant_id: str,
        parent_id: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[CustomerGroup]:
        """Get all customer_groups with filters"""
        with self._session_factory() as session:
            conditions = [
                CustomerGroupModel.tenant_id == tenant_id,
                CustomerGroupModel.is_deleted == False,
            ]

            if parent_id is not None:
                if parent_id == "":
                    parent_id = None
                if parent_id is None:
                    conditions.append(
                        CustomerGroupModel.parent_id.is_(None)
                    )
                else:
                    conditions.append(
                        CustomerGroupModel.parent_id
                        == parent_id
                    )

            if is_active is not None:
                conditions.append(CustomerGroupModel.is_active == is_active)

            statement = (
                select(CustomerGroupModel)
                .where(and_(*conditions))
                .order_by(CustomerGroupModel.sort_order, CustomerGroupModel.name)
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]

    async def get_customer_group_tree(self, tenant_id: str) -> List[CustomerGroup]:
        """Get full customer_group tree with hierarchy"""
        with self._session_factory() as session:
            statement = (
                select(CustomerGroupModel)
                .where(
                    and_(
                        CustomerGroupModel.tenant_id == tenant_id,
                        CustomerGroupModel.is_deleted == False,
                    )
                )
                .order_by(CustomerGroupModel.level, CustomerGroupModel.sort_order)
            )
            models = session.exec(statement).all()

        node_map: Dict[str, CustomerGroup] = {}
        for model in models:
            node_map[model.id] = self._mapper.to_domain(model)

        roots: List[CustomerGroup] = []
        for model in models:
            node = node_map[model.id]
            parent_id = model.parent_id
            if parent_id and parent_id in node_map:
                node_map[parent_id].add_child(node)
            else:
                roots.append(node)

        for node in node_map.values():
            if node.children:
                node.children.sort(key=lambda child: (child.sort_order, child.name))
        roots.sort(key=lambda root: (root.sort_order, root.name))
        return roots


