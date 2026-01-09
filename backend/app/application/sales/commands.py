"""sales commands for CQRS pattern"""
from dataclasses import dataclass, field
from datetime import date
from typing import Optional, List

@dataclass
class CreateCustomerCommand:
    """Command to create a new customer"""
    name: str = ""
    email: Optional[str] = None
    phone: Optional[str] = None
    business_name: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    id_number: Optional[str] = None
    id_type: Optional[str] = None
    event_preferences: Optional[str] = None
    seating_preferences: Optional[str] = None
    accessibility_needs: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    preferred_language: Optional[str] = None
    marketing_opt_in: bool = False
    email_marketing: bool = False
    sms_marketing: bool = False
    facebook_url: Optional[str] = None
    twitter_handle: Optional[str] = None
    linkedin_url: Optional[str] = None
    instagram_handle: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None
    public_notes: Optional[str] = None

@dataclass
class UpdateCustomerCommand:
    """Command to update customer details"""
    customer_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    business_name: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    id_number: Optional[str] = None
    id_type: Optional[str] = None
    event_preferences: Optional[str] = None
    seating_preferences: Optional[str] = None
    accessibility_needs: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    preferred_language: Optional[str] = None
    marketing_opt_in: Optional[bool] = None
    email_marketing: Optional[bool] = None
    sms_marketing: Optional[bool] = None
    facebook_url: Optional[str] = None
    twitter_handle: Optional[str] = None
    linkedin_url: Optional[str] = None
    instagram_handle: Optional[str] = None
    website: Optional[str] = None
    status: Optional[str] = None  # "active" or "inactive"
    status_reason: Optional[str] = None
    notes: Optional[str] = None
    public_notes: Optional[str] = None

@dataclass
class DeleteCustomerCommand:
    """Command to remove a customer"""

    customer_id: str
