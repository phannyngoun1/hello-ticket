"""
Tag repository implementation - Adapter in Hexagonal Architecture
"""
import asyncio
from typing import List, Optional
from sqlmodel import Session, select, and_, or_, func
from sqlalchemy.exc import IntegrityError

from app.domain.shared.tag import Tag
from app.domain.shared.tag_link import TagLink
from app.domain.shared.tag_repository import TagRepository, TagLinkRepository
from app.infrastructure.shared.database.models import TagModel, TagLinkModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.shared.mapper_tag import TagMapper
from app.shared.tenant_context import get_tenant_context
from app.shared.exceptions import BusinessRuleError


class SQLTagRepository(TagRepository):
    """SQLModel implementation of TagRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._mapper = TagMapper()
        self._tenant_id = tenant_id
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def save(self, tag: Tag) -> Tag:
        """Save or update a tag"""
        tenant_id = self._get_tenant_id()
        
        with self._session_factory() as session:
            statement = select(TagModel).where(
                and_(
                    TagModel.id == tag.id,
                    TagModel.tenant_id == tenant_id
                )
            )
            existing_model = session.exec(statement).first()
            
            if existing_model:
                updated_model = self._mapper.to_model(tag)
                merged_model = session.merge(updated_model)
                try:
                    session.commit()
                    session.refresh(merged_model)
                    return self._mapper.to_domain(merged_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to update tag: {str(e)}")
            else:
                new_model = self._mapper.to_model(tag)
                session.add(new_model)
                try:
                    session.commit()
                    session.refresh(new_model)
                    return self._mapper.to_domain(new_model)
                except IntegrityError as e:
                    session.rollback()
                    raise BusinessRuleError(f"Failed to create tag: {str(e)}")
    
    async def get_by_id(self, tenant_id: str, tag_id: str) -> Optional[Tag]:
        """Get tag by ID"""
        with self._session_factory() as session:
            statement = select(TagModel).where(
                and_(
                    TagModel.id == tag_id,
                    TagModel.tenant_id == tenant_id
                )
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_by_name(self, tenant_id: str, entity_type: str, name: str) -> Optional[Tag]:
        """Get tag by name and entity type (normalized)"""
        normalized_name = name.strip().lower()
        with self._session_factory() as session:
            statement = select(TagModel).where(
                and_(
                    TagModel.tenant_id == tenant_id,
                    TagModel.entity_type == entity_type.lower(),
                    TagModel.name == normalized_name
                )
            )
            model = session.exec(statement).first()
            return self._mapper.to_domain(model) if model else None
    
    async def get_all(
        self,
        tenant_id: str,
        entity_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> List[Tag]:
        """Get all tags with pagination and filtering"""
        with self._session_factory() as session:
            conditions = [TagModel.tenant_id == tenant_id]
            
            if entity_type:
                conditions.append(TagModel.entity_type == entity_type.lower())
            
            if search:
                search_term = f"%{search}%"
                conditions.append(
                    or_(
                        TagModel.name.ilike(search_term),
                        TagModel.description.ilike(search_term) if TagModel.description else False
                    )
                )
            
            if is_active is not None:
                conditions.append(TagModel.is_active == is_active)
            
            statement = (
                select(TagModel)
                .where(and_(*conditions))
                .order_by(TagModel.entity_type, TagModel.name)
                .offset(skip)
                .limit(limit)
            )
            models = session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def delete(self, tenant_id: str, tag_id: str) -> bool:
        """Delete tag by ID"""
        with self._session_factory() as session:
            statement = select(TagModel).where(
                and_(
                    TagModel.id == tag_id,
                    TagModel.tenant_id == tenant_id
                )
            )
            model = session.exec(statement).first()
            if not model:
                return False
            
            session.delete(model)
            try:
                session.commit()
                return True
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to delete tag: {str(e)}")
    
    async def exists_by_name(self, tenant_id: str, entity_type: str, name: str) -> bool:
        """Check if tag exists by name and entity type"""
        normalized_name = name.strip().lower()
        with self._session_factory() as session:
            statement = select(TagModel).where(
                and_(
                    TagModel.tenant_id == tenant_id,
                    TagModel.entity_type == entity_type.lower(),
                    TagModel.name == normalized_name
                )
            )
            model = session.exec(statement).first()
            return model is not None


class SQLTagLinkRepository(TagLinkRepository):
    """SQLModel implementation of TagLinkRepository"""
    
    def __init__(self, session: Optional[Session] = None, tenant_id: Optional[str] = None):
        self._session_factory = session if session else get_session_sync
        self._tag_repository = SQLTagRepository(session, tenant_id)
        self._tenant_id = tenant_id
    
    def _get_tenant_id(self) -> str:
        """Get tenant ID from override or context"""
        if self._tenant_id:
            return self._tenant_id
        tenant_id = get_tenant_context()
        if not tenant_id:
            raise ValueError("Tenant context not set. Multi-tenancy requires tenant identification.")
        return tenant_id
    
    async def link_tag(
        self,
        tenant_id: str,
        tag_id: str,
        entity_type: str,
        entity_id: str,
    ) -> TagLink:
        """Link a tag to an entity"""
        session = self._session_factory()
        try:
            # Check if link already exists
            statement = select(TagLinkModel).where(
                and_(
                    TagLinkModel.tag_id == tag_id,
                    TagLinkModel.entity_type == entity_type.lower(),
                    TagLinkModel.entity_id == entity_id,
                    TagLinkModel.tenant_id == tenant_id
                )
            )
            existing = session.exec(statement).first()
            
            if existing:
                return TagLink(
                    tag_id=existing.tag_id,
                    entity_type=existing.entity_type,
                    entity_id=existing.entity_id,
                    tag_link_id=existing.id,
                    tenant_id=existing.tenant_id,
                    created_at=existing.created_at,
                )
            
            # Create new link
            link_model = TagLinkModel(
                tenant_id=tenant_id,
                tag_id=tag_id,
                entity_type=entity_type.lower(),
                entity_id=entity_id,
            )
            session.add(link_model)
            try:
                session.commit()
                session.refresh(link_model)
                return TagLink(
                    tag_id=link_model.tag_id,
                    entity_type=link_model.entity_type,
                    entity_id=link_model.entity_id,
                    tag_link_id=link_model.id,
                    tenant_id=link_model.tenant_id,
                    created_at=link_model.created_at,
                )
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to link tag: {str(e)}")
        finally:
            session.close()
    
    async def unlink_tag(
        self,
        tenant_id: str,
        tag_id: str,
        entity_type: str,
        entity_id: str,
    ) -> bool:
        """Unlink a tag from an entity"""
        session = self._session_factory()
        try:
            statement = select(TagLinkModel).where(
                and_(
                    TagLinkModel.tag_id == tag_id,
                    TagLinkModel.entity_type == entity_type.lower(),
                    TagLinkModel.entity_id == entity_id,
                    TagLinkModel.tenant_id == tenant_id
                )
            )
            link_model = session.exec(statement).first()
            if not link_model:
                return False
            
            session.delete(link_model)
            try:
                session.commit()
                return True
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to unlink tag: {str(e)}")
        finally:
            session.close()
    
    async def get_tags_for_entity(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
    ) -> List[Tag]:
        """Get all tags linked to an entity"""
        def _get_tags_sync():
            """Synchronous function to get tags"""
            session = self._session_factory()
            try:
                statement = (
                    select(TagModel)
                    .join(TagLinkModel, TagModel.id == TagLinkModel.tag_id)
                    .where(
                        and_(
                            TagLinkModel.tenant_id == tenant_id,
                            TagLinkModel.entity_type == entity_type.lower(),
                            TagLinkModel.entity_id == entity_id,
                            TagModel.is_active == True
                        )
                    )
                    .order_by(TagModel.name)
                )
                models = session.exec(statement).all()
                mapper = TagMapper()
                return [mapper.to_domain(model) for model in models]
            finally:
                session.close()
        
        # Run sync database operations in thread pool to avoid blocking
        return await asyncio.to_thread(_get_tags_sync)
    
    async def get_entities_for_tag(
        self,
        tenant_id: str,
        tag_id: str,
        entity_type: Optional[str] = None,
    ) -> List[TagLink]:
        """Get all entities linked to a tag"""
        session = self._session_factory()
        try:
            conditions = [
                TagLinkModel.tenant_id == tenant_id,
                TagLinkModel.tag_id == tag_id
            ]
            if entity_type:
                conditions.append(TagLinkModel.entity_type == entity_type.lower())
            
            statement = select(TagLinkModel).where(and_(*conditions))
            models = session.exec(statement).all()
            return [
                TagLink(
                    tag_id=m.tag_id,
                    entity_type=m.entity_type,
                    entity_id=m.entity_id,
                    tag_link_id=m.id,
                    tenant_id=m.tenant_id,
                    created_at=m.created_at,
                )
                for m in models
            ]
        finally:
            session.close()
    
    async def set_tags_for_entity(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
        tag_ids: List[str],
    ) -> List[Tag]:
        """Set tags for an entity (replaces existing tags)"""
        def _set_tags_sync():
            """Synchronous function to set tags"""
            session = self._session_factory()
            try:
                # Normalize and deduplicate tag IDs
                normalized_tag_ids = list(set(
                    tag_id.strip() 
                    for tag_id in tag_ids 
                    if tag_id and tag_id.strip()
                ))
                
                # Remove existing links
                delete_statement = select(TagLinkModel).where(
                    and_(
                        TagLinkModel.tenant_id == tenant_id,
                        TagLinkModel.entity_type == entity_type.lower(),
                        TagLinkModel.entity_id == entity_id
                    )
                )
                existing_links = session.exec(delete_statement).all()
                for link in existing_links:
                    session.delete(link)
                
                # Flush deletion to ensure it's applied before inserts
                session.flush()
                
                # Add new links (check for existence to avoid duplicates)
                tags = []
                mapper = TagMapper()
                for tag_id in normalized_tag_ids:
                    # Check if link already exists (shouldn't happen after deletion, but be safe)
                    existing_link = session.exec(
                        select(TagLinkModel).where(
                            and_(
                                TagLinkModel.tenant_id == tenant_id,
                                TagLinkModel.tag_id == tag_id,
                                TagLinkModel.entity_type == entity_type.lower(),
                                TagLinkModel.entity_id == entity_id
                            )
                        )
                    ).first()
                    
                    if existing_link:
                        # Link already exists, skip creation
                        tag_statement = select(TagModel).where(
                            and_(
                                TagModel.id == tag_id,
                                TagModel.tenant_id == tenant_id
                            )
                        )
                        tag_model = session.exec(tag_statement).first()
                        if tag_model:
                            tags.append(mapper.to_domain(tag_model))
                    else:
                        # Create new link
                        link_model = TagLinkModel(
                            tenant_id=tenant_id,
                            tag_id=tag_id,
                            entity_type=entity_type.lower(),
                            entity_id=entity_id,
                        )
                        session.add(link_model)
                        
                        # Get tag for return
                        tag_statement = select(TagModel).where(
                            and_(
                                TagModel.id == tag_id,
                                TagModel.tenant_id == tenant_id
                            )
                        )
                        tag_model = session.exec(tag_statement).first()
                        if tag_model:
                            tags.append(mapper.to_domain(tag_model))
                
                session.commit()
                return tags
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to set tags: {str(e)}")
            finally:
                session.close()
        
        # Run sync database operations in thread pool to avoid blocking
        return await asyncio.to_thread(_set_tags_sync)
    
    async def unlink_all_tags(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
    ) -> bool:
        """Unlink all tags from an entity"""
        session = self._session_factory()
        try:
            statement = select(TagLinkModel).where(
                and_(
                    TagLinkModel.tenant_id == tenant_id,
                    TagLinkModel.entity_type == entity_type.lower(),
                    TagLinkModel.entity_id == entity_id
                )
            )
            links = session.exec(statement).all()
            for link in links:
                session.delete(link)
            
            try:
                session.commit()
                return True
            except IntegrityError as e:
                session.rollback()
                raise BusinessRuleError(f"Failed to unlink tags: {str(e)}")
        finally:
            session.close()

