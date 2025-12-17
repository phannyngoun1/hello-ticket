"""
User-related Pydantic schemas
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserBase(BaseModel):
    """Base user schema"""
    username: str = Field(min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_-]+$')
    first_name: str = Field(min_length=1, max_length=50, pattern=r'^[a-zA-Z0-9\s\'\-\.]+$')
    last_name: str = Field(min_length=1, max_length=50, pattern=r'^[a-zA-Z0-9\s\'\-\.]+$')
    email: EmailStr


class UserCreate(BaseModel):
    """User creation schema - username auto-generated from email if not provided"""
    username: Optional[str] = None
    first_name: str = Field(min_length=1, max_length=50, pattern=r'^[a-zA-Z0-9\s\'\-\.]+$')
    last_name: str = Field(min_length=1, max_length=50, pattern=r'^[a-zA-Z0-9\s\'\-\.]+$')
    email: EmailStr
    password: Optional[str] = Field(None, min_length=8)  # Optional password for authenticated users
    role: Optional[str] = Field(None, pattern=r'^(admin|manager|user|guest)$')  # Optional role
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        """Validate username if provided"""
        if v is not None:
            if len(v) < 3 or len(v) > 50:
                raise ValueError('username must be between 3 and 50 characters')
            if not v.replace('_', '').replace('-', '').isalnum():
                raise ValueError('username can only contain alphanumeric characters, underscores, and hyphens')
        return v


class UserUpdate(BaseModel):
    """User update schema"""
    username: Optional[str] = Field(None, min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_-]+$')
    first_name: Optional[str] = Field(None, min_length=1, max_length=50, pattern=r'^[a-zA-Z0-9\s\'\-\.]+$')
    last_name: Optional[str] = Field(None, min_length=1, max_length=50, pattern=r'^[a-zA-Z0-9\s\'\-\.]+$')
    email: Optional[EmailStr] = None


class UserResponse(UserBase):
    """User response schema"""
    id: str
    created_at: datetime
    updated_at: datetime
    is_active: bool
    base_role: Optional[str] = None
    last_login: Optional[datetime] = None
    locked_until: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserDetailResponse(UserResponse):
    """Detailed user response schema with additional fields for view user details"""
    is_verified: bool = False
    must_change_password: bool = False
    last_password_change: Optional[datetime] = None
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None
    tenant_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class PaginatedUserResponse(BaseModel):
    """Paginated user response schema"""
    items: List[UserResponse]
    total: int
    skip: int
    limit: int
    page: int  # Calculated page number
    total_pages: int  # Total number of pages


class ResetPasswordRequest(BaseModel):
    """Password reset request schema"""
    new_password: str = Field(..., min_length=8, description="New password for the user")


class ComplexUsersSearchRequest(BaseModel):
    """Request schema for complex user search with arrays and nested filters"""
    filter: Optional[dict] = Field(default_factory=dict, description="Filter criteria")
    pagination: Optional[dict] = Field(
        default_factory=lambda: {"skip": 0, "limit": 100},
        description="Pagination parameters"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "filter": {
                    "search": "john",
                    "status": "active",
                    "userIds": ["id1", "id2", "id3"],
                    "tags": ["tag1", "tag2"],
                    "created_after": "2024-01-01T00:00:00Z",
                },
                "pagination": {
                    "skip": 0,
                    "limit": 100
                }
            }
        }

