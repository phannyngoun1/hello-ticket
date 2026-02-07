"""Pydantic schemas for Sales APIs"""
from datetime import datetime, date
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, EmailStr, field_validator


class EmployeeCreateRequest(BaseModel):
    """Payload for employee creation"""

    code: Optional[str] = Field(None, description="Employee business code (auto-generated)")
    name: str = Field(..., description="Display name for the employee")
    
    # System Link
    user_id: Optional[str] = Field(None, description="Link to Platform User ID")
    work_email: Optional[EmailStr] = Field(None, description="Official business email")
    
    # Organizational Structure
    job_title: Optional[str] = Field(None, description="Position title")
    department: Optional[str] = Field(None, description="Department name")
    employment_type: Optional[str] = Field(None, description="Full-time, Part-time, Contractor, etc.")
    hire_date: Optional[date] = Field(None, description="Employment start date (YYYY-MM-DD or empty)")
    
    # Contact & Location
    work_phone: Optional[str] = Field(None, description="Office phone/extension")
    mobile_phone: Optional[str] = Field(None, description="Mobile contact")
    office_location: Optional[str] = Field(None, description="Physical office location")
    timezone: Optional[str] = Field("UTC", description="Employee timezone")
    
    # Sales & Operational
    skills: Optional[List[str]] = Field(None, description="Array of skill tags")
    assigned_territories: Optional[List[str]] = Field(None, description="Array of territory codes")
    quota_config: Optional[Dict[str, Any]] = Field(None, description="Quota configuration object")
    commission_tier: Optional[str] = Field(None, description="Commission plan identifier")
    
    # Personal (HR)
    birthday: Optional[date] = Field(None, description="Birthday for celebrations (YYYY-MM-DD or empty)")

    @field_validator("hire_date", "birthday", mode="before")
    @classmethod
    def normalize_date_fields(cls, v: Any) -> Optional[date]:
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return v

    emergency_contact_name: Optional[str] = Field(None, description="Emergency contact name")
    emergency_contact_phone: Optional[str] = Field(None, description="Emergency contact phone")
    emergency_contact_relationship: Optional[str] = Field(None, description="Emergency contact relationship")


class EmployeeUpdateRequest(BaseModel):
    """Payload for employee updates"""

    code: Optional[str] = Field(None, description="Employee business code")
    name: Optional[str] = Field(None, description="Display name for the employee")
    
    # System Link
    user_id: Optional[str] = Field(None, description="Link to Platform User ID")
    work_email: Optional[EmailStr] = Field(None, description="Official business email")
    
    # Organizational Structure
    job_title: Optional[str] = Field(None, description="Position title")
    department: Optional[str] = Field(None, description="Department name")
    employment_type: Optional[str] = Field(None, description="Full-time, Part-time, Contractor, etc.")
    hire_date: Optional[date] = Field(None, description="Employment start date (YYYY-MM-DD or empty)")
    
    # Contact & Location
    work_phone: Optional[str] = Field(None, description="Office phone/extension")
    mobile_phone: Optional[str] = Field(None, description="Mobile contact")
    office_location: Optional[str] = Field(None, description="Physical office location")
    timezone: Optional[str] = Field(None, description="Employee timezone")
    
    # Sales & Operational
    skills: Optional[List[str]] = Field(None, description="Array of skill tags")
    assigned_territories: Optional[List[str]] = Field(None, description="Array of territory codes")
    quota_config: Optional[Dict[str, Any]] = Field(None, description="Quota configuration object")
    commission_tier: Optional[str] = Field(None, description="Commission plan identifier")
    
    # Personal (HR)
    birthday: Optional[date] = Field(None, description="Birthday for celebrations (YYYY-MM-DD or empty)")

    @field_validator("hire_date", "birthday", mode="before")
    @classmethod
    def normalize_date_fields(cls, v: Any) -> Optional[date]:
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return v

    emergency_contact_name: Optional[str] = Field(None, description="Emergency contact name")
    emergency_contact_phone: Optional[str] = Field(None, description="Emergency contact phone")
    emergency_contact_relationship: Optional[str] = Field(None, description="Emergency contact relationship")


class EmployeeResponse(BaseModel):
    """Employee response model"""

    id: str
    tenant_id: str
    code: str
    name: str
    
    # System Link
    user_id: Optional[str]
    work_email: Optional[str]
    
    # Organizational Structure
    job_title: Optional[str]
    department: Optional[str]
    employment_type: Optional[str]
    hire_date: Optional[date]
    
    # Contact & Location
    work_phone: Optional[str]
    mobile_phone: Optional[str]
    office_location: Optional[str]
    timezone: str
    
    # Sales & Operational
    skills: Optional[List[str]]
    assigned_territories: Optional[List[str]]
    quota_config: Optional[Dict[str, Any]]
    commission_tier: Optional[str]
    
    # Personal (HR)
    birthday: Optional[date]
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    emergency_contact_relationship: Optional[str]

    is_active: bool
    created_at: datetime
    updated_at: datetime
    deactivated_at: Optional[datetime]


class EmployeeListResponse(BaseModel):
    """Paginated employee list response"""

    items: List[EmployeeResponse]
    skip: int
    limit: int
    total: int
    has_next: bool


