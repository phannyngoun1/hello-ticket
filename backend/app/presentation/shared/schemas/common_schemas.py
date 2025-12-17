"""
Common/shared schemas used across the API
"""
from typing import List
from pydantic import BaseModel


class PaginatedResponse(BaseModel):
    """Paginated response schema"""
    items: List[dict]
    total: int
    skip: int
    limit: int


class ErrorDetail(BaseModel):
    """Error detail schema"""
    code: str
    message: str
    details: dict = {}


class ErrorResponse(BaseModel):
    """Error response schema"""
    error: ErrorDetail

