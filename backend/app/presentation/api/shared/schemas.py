from datetime import datetime
from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class BaseResponse(BaseModel):
    """Base response model with common fields"""
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class BaseListResponse(BaseModel, Generic[T]):
    """Base paginated list response"""
    items: List[T]
    skip: int
    limit: int
    total: int
    has_next: bool
