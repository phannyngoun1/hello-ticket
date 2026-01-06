"""FastAPI routes for tag management"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query

from app.application.shared.tag_commands import (
    CreateTagCommand,
    UpdateTagCommand,
    DeleteTagCommand,
    SetEntityTagsCommand,
)
from app.application.shared.tag_queries import (
    GetTagByIdQuery,
    GetTagByNameQuery,
    SearchTagsQuery,
    GetTagsForEntityQuery,
    GetAvailableTagsForEntityQuery,
)
from app.application.shared.tag_commands import ManageEntityTagsCommand
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.api.shared.schemas_tag import (
    TagCreateRequest,
    TagUpdateRequest,
    TagResponse,
    TagListResponse,
    SetEntityTagsRequest,
    GetOrCreateTagsRequest,
    GetOrCreateTagsResponse,
    GetAvailableTagsResponse,
    TagWithAttachmentStatus,
    ManageEntityTagsRequest,
    ManageEntityTagsResponse,
)
from app.presentation.core.dependencies.auth_dependencies import RequirePermission, RequireAnyPermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.domain.shared.tag_repository import TagRepository
from app.shared.container import get_container

router = APIRouter(prefix="/shared/tags", tags=["tags"])




def tag_to_response(tag) -> TagResponse:
    """Convert domain tag to response"""
    return TagResponse(
        id=tag.id,
        tenant_id=tag.tenant_id,
        name=tag.name,
        entity_type=tag.entity_type,
        description=tag.description,
        color=tag.color,
        is_active=tag.is_active,
        created_at=tag.created_at.isoformat() if tag.created_at else "",
        updated_at=tag.updated_at.isoformat() if tag.updated_at else "",
    )


@router.post("", response_model=TagResponse, status_code=201)
async def create_tag(
    request: TagCreateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Create a new tag"""
    try:
        command = CreateTagCommand(
            name=request.name,
            entity_type=request.entity_type,
            description=request.description,
            color=request.color,
        )
        tag = await mediator.send(command)
        return tag_to_response(tag)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(
    tag_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Get a tag by ID"""
    try:
        query = GetTagByIdQuery(tag_id=tag_id)
        tag = await mediator.query(query)
        if not tag:
            raise HTTPException(status_code=404, detail=f"Tag with ID '{tag_id}' not found")
        return tag_to_response(tag)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("", response_model=TagListResponse)
async def search_tags(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    search: Optional[str] = Query(None, description="Search term"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.VIEW_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Search tags"""
    try:
        query = SearchTagsQuery(
            entity_type=entity_type,
            search=search,
            is_active=is_active,
            skip=skip,
            limit=limit,
        )
        result = await mediator.query(query)
        return TagListResponse(
            items=[tag_to_response(tag) for tag in result.items],
            total=result.total,
            has_next=result.has_next,
        )
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: str,
    request: TagUpdateRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Update a tag"""
    try:
        command = UpdateTagCommand(
            tag_id=tag_id,
            name=request.name,
            entity_type=request.entity_type,
            description=request.description,
            color=request.color,
        )
        tag = await mediator.send(command)
        return tag_to_response(tag)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{tag_id}", status_code=204)
async def delete_tag(
    tag_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Delete a tag"""
    try:
        command = DeleteTagCommand(tag_id=tag_id)
        await mediator.send(command)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/get-or-create", response_model=GetOrCreateTagsResponse)
async def get_or_create_tags(
    request: GetOrCreateTagsRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_SALES_CUSTOMER)),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Get existing tags or create new ones by name"""
    try:
        container = get_container()
        tag_repository = container.resolve(TagRepository)
        from app.shared.tenant_context import get_tenant_context
        tenant_id = get_tenant_context()
        
        tag_ids = []
        for tag_name in request.tag_names:
            if not tag_name or not tag_name.strip():
                continue
            
            # Try to find existing tag
            existing_tag = await tag_repository.get_by_name(tenant_id, request.entity_type, tag_name.strip())
            if existing_tag:
                tag_ids.append(existing_tag.id)
            else:
                # Create new tag if it doesn't exist
                try:
                    create_tag_cmd = CreateTagCommand(
                        name=tag_name.strip(),
                        entity_type=request.entity_type
                    )
                    new_tag = await mediator.send(create_tag_cmd)
                    tag_ids.append(new_tag.id)
                except BusinessRuleError:
                    # Tag might have been created by another request, try to get it again
                    existing_tag = await tag_repository.get_by_name(tenant_id, request.entity_type, tag_name.strip())
                    if existing_tag:
                        tag_ids.append(existing_tag.id)
        
        return GetOrCreateTagsResponse(tag_ids=tag_ids)
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/entity/{entity_type}/{entity_id}", response_model=List[TagResponse])
async def get_entity_tags(
    entity_type: str,
    entity_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([
        Permission.VIEW_SALES_CUSTOMER,
        Permission.VIEW_TICKETING_ORGANIZER
    ])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Get all tags for an entity"""
    try:
        query = GetTagsForEntityQuery(entity_type=entity_type, entity_id=entity_id)
        tags = await mediator.query(query)
        return [tag_to_response(tag) for tag in tags]
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/entity/{entity_type}/{entity_id}/tags", response_model=List[TagResponse])
async def set_entity_tags(
    entity_type: str,
    entity_id: str,
    request: SetEntityTagsRequest,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([
        Permission.CREATE_SALES_CUSTOMER,
        Permission.MANAGE_TICKETING_ORGANIZER
    ])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Set tags for an entity (replaces existing tags)"""
    try:
        command = SetEntityTagsCommand(
            entity_type=entity_type,
            entity_id=entity_id,
            tag_ids=request.tag_ids,
        )
        tags = await mediator.send(command)
        return [tag_to_response(tag) for tag in tags]
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/entity/{entity_type}/{entity_id}/available", response_model=GetAvailableTagsResponse)
async def get_available_tags_for_entity(
    entity_type: str,
    entity_id: str,
    search: Optional[str] = Query(None, description="Search term for tag names"),
    limit: int = Query(200, ge=1, le=500, description="Maximum number of tags to return"),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([
        Permission.VIEW_SALES_CUSTOMER,
        Permission.VIEW_TICKETING_ORGANIZER
    ])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Get all available tags for an entity type with attachment status"""
    try:
        query = GetAvailableTagsForEntityQuery(
            entity_type=entity_type,
            entity_id=entity_id,
            search=search,
            limit=limit,
        )
        result = await mediator.query(query)
        
        items = [
            TagWithAttachmentStatus(
                id=item.tag.id,
                tenant_id=item.tag.tenant_id,
                name=item.tag.name,
                entity_type=item.tag.entity_type,
                description=item.tag.description,
                color=item.tag.color,
                is_active=item.tag.is_active,
                created_at=item.tag.created_at.isoformat() if item.tag.created_at else "",
                updated_at=item.tag.updated_at.isoformat() if item.tag.updated_at else "",
                is_attached=item.is_attached,
            )
            for item in result
        ]
        
        return GetAvailableTagsResponse(items=items, total=len(items))
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/entity/{entity_type}/{entity_id}/manage", response_model=ManageEntityTagsResponse)
async def manage_entity_tags(
    entity_type: str,
    entity_id: str,
    request: ManageEntityTagsRequest,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([
        Permission.CREATE_SALES_CUSTOMER,
        Permission.MANAGE_TICKETING_ORGANIZER
    ])),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """Manage entity tags - creates new tags and attaches them in one operation"""
    try:
        command = ManageEntityTagsCommand(
            entity_type=entity_type,
            entity_id=entity_id,
            tag_names=request.tag_names,
        )
        tags, created_count = await mediator.send(command)
        return ManageEntityTagsResponse(
            tags=[tag_to_response(tag) for tag in tags],
            created_count=created_count,
        )
    except (BusinessRuleError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

