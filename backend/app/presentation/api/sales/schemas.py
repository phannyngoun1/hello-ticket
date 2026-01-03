"""Pydantic schemas for sales APIs"""
from datetime import datetime, date
from typing import List, Optional

from pydantic import BaseModel, Field, EmailStr


class CustomerCreateRequest(BaseModel):
    """Payload for customer creation"""
    # Essential
    name: str = Field(..., description="Display name for the customer")
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    business_name: Optional[str] = Field(None, description="Business name")
    # Address
    street_address: Optional[str] = Field(None, description="Street address")
    city: Optional[str] = Field(None, description="City")
    state_province: Optional[str] = Field(None, description="State or province")
    postal_code: Optional[str] = Field(None, description="Postal code")
    country: Optional[str] = Field(None, description="Country")
    # Customer Profile
    date_of_birth: Optional[date] = Field(None, description="Date of birth")
    gender: Optional[str] = Field(None, description="Gender")
    nationality: Optional[str] = Field(None, description="Nationality")
    id_number: Optional[str] = Field(None, description="Government ID number")
    id_type: Optional[str] = Field(None, description="ID type (Passport, Driver's License, etc.)")
    # Preferences & Settings
    event_preferences: Optional[str] = Field(None, description="Preferred event types")
    seating_preferences: Optional[str] = Field(None, description="Preferred seating areas")
    accessibility_needs: Optional[str] = Field(None, description="Accessibility requirements")
    dietary_restrictions: Optional[str] = Field(None, description="Dietary restrictions")
    emergency_contact_name: Optional[str] = Field(None, description="Emergency contact name")
    emergency_contact_phone: Optional[str] = Field(None, description="Emergency contact phone")
    emergency_contact_relationship: Optional[str] = Field(None, description="Emergency contact relationship")
    preferred_language: Optional[str] = Field(None, description="Preferred language")
    marketing_opt_in: bool = Field(False, description="Marketing opt-in")
    email_marketing: bool = Field(False, description="Email marketing consent")
    sms_marketing: bool = Field(False, description="SMS marketing consent")
    # Social & Online
    facebook_url: Optional[str] = Field(None, description="Facebook URL")
    twitter_handle: Optional[str] = Field(None, description="Twitter/X handle")
    linkedin_url: Optional[str] = Field(None, description="LinkedIn URL")
    instagram_handle: Optional[str] = Field(None, description="Instagram handle")
    website: Optional[str] = Field(None, description="Website URL")
    # Classification
    priority: Optional[str] = Field(None, description="Priority level (High, Medium, Low)")
    notes: Optional[str] = Field(None, description="Internal notes")
    public_notes: Optional[str] = Field(None, description="Public notes")


class CustomerUpdateRequest(BaseModel):
    """Payload for customer updates"""
    name: Optional[str] = Field(None, description="Display name for the customer")
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    business_name: Optional[str] = Field(None, description="Business name")
    street_address: Optional[str] = Field(None, description="Street address")
    city: Optional[str] = Field(None, description="City")
    state_province: Optional[str] = Field(None, description="State or province")
    postal_code: Optional[str] = Field(None, description="Postal code")
    country: Optional[str] = Field(None, description="Country")
    date_of_birth: Optional[date] = Field(None, description="Date of birth")
    gender: Optional[str] = Field(None, description="Gender")
    nationality: Optional[str] = Field(None, description="Nationality")
    id_number: Optional[str] = Field(None, description="Government ID number")
    id_type: Optional[str] = Field(None, description="ID type")
    event_preferences: Optional[str] = Field(None, description="Preferred event types")
    seating_preferences: Optional[str] = Field(None, description="Preferred seating areas")
    accessibility_needs: Optional[str] = Field(None, description="Accessibility requirements")
    dietary_restrictions: Optional[str] = Field(None, description="Dietary restrictions")
    emergency_contact_name: Optional[str] = Field(None, description="Emergency contact name")
    emergency_contact_phone: Optional[str] = Field(None, description="Emergency contact phone")
    emergency_contact_relationship: Optional[str] = Field(None, description="Emergency contact relationship")
    preferred_language: Optional[str] = Field(None, description="Preferred language")
    marketing_opt_in: Optional[bool] = Field(None, description="Marketing opt-in")
    email_marketing: Optional[bool] = Field(None, description="Email marketing consent")
    sms_marketing: Optional[bool] = Field(None, description="SMS marketing consent")
    facebook_url: Optional[str] = Field(None, description="Facebook URL")
    twitter_handle: Optional[str] = Field(None, description="Twitter/X handle")
    linkedin_url: Optional[str] = Field(None, description="LinkedIn URL")
    instagram_handle: Optional[str] = Field(None, description="Instagram handle")
    website: Optional[str] = Field(None, description="Website URL")
    priority: Optional[str] = Field(None, description="Priority level")
    status: Optional[str] = Field(None, description="Customer status (active/inactive)")
    status_reason: Optional[str] = Field(None, description="Status reason")
    notes: Optional[str] = Field(None, description="Internal notes")
    public_notes: Optional[str] = Field(None, description="Public notes")


class CustomerResponse(BaseModel):
    """Customer response model"""
    id: str
    tenant_id: str
    code: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    business_name: Optional[str]
    street_address: Optional[str]
    city: Optional[str]
    state_province: Optional[str]
    postal_code: Optional[str]
    country: Optional[str]
    date_of_birth: Optional[date]
    gender: Optional[str]
    nationality: Optional[str]
    id_number: Optional[str]
    id_type: Optional[str]
    account_manager_id: Optional[str]
    sales_representative_id: Optional[str]
    customer_since: Optional[datetime]
    last_purchase_date: Optional[datetime]
    total_purchase_amount: float
    last_contact_date: Optional[datetime]
    event_preferences: Optional[str]
    seating_preferences: Optional[str]
    accessibility_needs: Optional[str]
    dietary_restrictions: Optional[str]
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    emergency_contact_relationship: Optional[str]
    preferred_language: Optional[str]
    marketing_opt_in: bool
    email_marketing: bool
    sms_marketing: bool
    facebook_url: Optional[str]
    twitter_handle: Optional[str]
    linkedin_url: Optional[str]
    instagram_handle: Optional[str]
    website: Optional[str]
    tags: List[str]
    priority: Optional[str]
    status_reason: Optional[str]
    notes: Optional[str]
    public_notes: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deactivated_at: Optional[datetime]


class CustomerListResponse(BaseModel):
    """Paginated customer list response"""

    items: List[CustomerResponse]
    skip: int
    limit: int
    total: int
    has_next: bool
