"""
User Preferences API routes
"""
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, Depends, Query
from app.presentation.api.core.user_preference_schemas import (
    UserPreferenceResponse,
    UserPreferenceUpdateRequest,
    UserPreferenceSetRequest,
)
from app.shared.container import container
from app.application.core.user import UserPreferenceService
from app.domain.core.user.preference_repository import UserPreferenceRepository
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.presentation.core.dependencies.auth_dependencies import get_current_active_user


router = APIRouter(prefix="/user-preferences", tags=["user-preferences"])


def get_user_preference_service() -> UserPreferenceService:
    """Dependency to get user preference service"""
    repository = container.resolve(UserPreferenceRepository)
    return UserPreferenceService(repository)


@router.get("/", response_model=UserPreferenceResponse)
async def get_preferences(
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    service: UserPreferenceService = Depends(get_user_preference_service),
):
    """Get all user preferences"""
    preferences = await service.get_preferences(current_user.id, current_user.tenant_id)
    return UserPreferenceResponse(preferences=preferences)


@router.get("/get")
async def get_preference(
    path: list[str] = Query(default=[], description="Path to preference (e.g., ['ui', 'dataListView', 'roles']). If empty, returns all preferences"),
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    service: UserPreferenceService = Depends(get_user_preference_service),
):
    """Get a specific preference value by path"""
    if not path:
        # Return all preferences
        preferences = await service.get_preferences(current_user.id, current_user.tenant_id)
        return {"value": preferences}
    
    value = await service.get_preference(current_user.id, current_user.tenant_id, *path)
    return {"value": value}


@router.put("/", response_model=UserPreferenceResponse)
async def update_preferences(
    request: UserPreferenceUpdateRequest,
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    service: UserPreferenceService = Depends(get_user_preference_service),
):
    """Update user preferences (merge with existing)"""
    updated = await service.update_preferences(
        current_user.id,
        current_user.tenant_id,
        request.preferences
    )
    return UserPreferenceResponse(preferences=updated.preferences)


@router.post("/set", response_model=UserPreferenceResponse)
async def set_preference(
    request: UserPreferenceSetRequest,
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    service: UserPreferenceService = Depends(get_user_preference_service),
):
    """Set a specific preference value by path"""
    updated = await service.set_preference(
        current_user.id,
        current_user.tenant_id,
        *request.path,
        value=request.value
    )
    return UserPreferenceResponse(preferences=updated.preferences)


@router.delete("/remove")
async def remove_preference(
    path: list[str],
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    service: UserPreferenceService = Depends(get_user_preference_service),
):
    """Remove a preference by path"""
    if not path:
        raise HTTPException(status_code=400, detail="Path is required")
    
    result = await service.remove_preference(
        current_user.id,
        current_user.tenant_id,
        *path
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Preference not found")
    
    return {"message": "Preference removed", "preferences": result.preferences}


@router.delete("/clear")
async def clear_preferences(
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    service: UserPreferenceService = Depends(get_user_preference_service),
):
    """Clear all user preferences"""
    success = await service.clear_preferences(current_user.id, current_user.tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="No preferences found")
    
    return {"message": "All preferences cleared"}

