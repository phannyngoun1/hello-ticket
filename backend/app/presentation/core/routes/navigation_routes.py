"""
Navigation routes

Provides a centralized list of navigation items for the frontend (menu and command palette).
Items can later be permission-filtered or sourced from UI Builder pages.
"""
from typing import List, Optional
from pathlib import Path
import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.presentation.core.dependencies.auth_dependencies import get_current_user
from app.domain.shared.authenticated_user import AuthenticatedUser


class NavigationItemResponse(BaseModel):
    label: str
    path: str
    icon: Optional[str] = None  # lucide icon name (frontend maps string -> icon)
    shortcut: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[List[str]] = None  # Search keywords for command palette (e.g., ["cust", "client"] for customers)
    children: Optional[List["NavigationItemResponse"]] = None


NavigationItemResponse.model_rebuild()


router = APIRouter(prefix="/navigation", tags=["navigation"])


@router.get("", response_model=List[NavigationItemResponse])
async def get_navigation_items(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Return the navigation items available to the current user.

    Note: In the future, filter by user permissions/roles and/or compose from UI Builder pages.
    """
    # Load navigation items from JSON for easier maintenance.
    routes_path = Path(__file__).with_name("routes.json")

    with routes_path.open("r", encoding="utf-8") as f:
        raw_items = json.load(f)

    items: List[NavigationItemResponse] = [
        NavigationItemResponse(**item) for item in raw_items
    ]

    return items
