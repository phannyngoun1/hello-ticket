"""Customer aggregate for sales."""
from __future__ import annotations

from datetime import datetime, timezone, date
from typing import Optional, List

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id
from app.domain.shared.value_objects.address import Address
from app.domain.shared.value_objects.contact_info import ContactInfo

class Customer(AggregateRoot):
    """Represents a customer."""

    def __init__(
        self,
        tenant_id: str,
        code: str,
        name: str,
        customer_id: Optional[str] = None,
        # Essential Contact Information
        contact_info: Optional[ContactInfo] = None,
        business_name: Optional[str] = None,
        # Address Information
        address: Optional[Address] = None,
        # Customer Profile
        date_of_birth: Optional[date] = None,
        gender: Optional[str] = None,
        nationality: Optional[str] = None,
        id_number: Optional[str] = None,
        id_type: Optional[str] = None,
        # Account Management
        account_manager_id: Optional[str] = None,
        sales_representative_id: Optional[str] = None,
        customer_since: Optional[datetime] = None,
        last_purchase_date: Optional[datetime] = None,
        total_purchase_amount: float = 0.0,
        last_contact_date: Optional[datetime] = None,
        # Preferences & Settings
        event_preferences: Optional[str] = None,
        seating_preferences: Optional[str] = None,
        accessibility_needs: Optional[str] = None,
        dietary_restrictions: Optional[str] = None,
        emergency_contact_name: Optional[str] = None,
        emergency_contact_phone: Optional[str] = None,
        emergency_contact_relationship: Optional[str] = None,
        preferred_language: Optional[str] = None,
        marketing_opt_in: bool = False,
        email_marketing: bool = False,
        sms_marketing: bool = False,
        # Social & Online
        facebook_url: Optional[str] = None,
        twitter_handle: Optional[str] = None,
        linkedin_url: Optional[str] = None,
        instagram_handle: Optional[str] = None,
        website: Optional[str] = None,
        # Tags & Classification
        tags: Optional[List[str]] = None,
        status_reason: Optional[str] = None,
        notes: Optional[str] = None,  # Internal notes
        public_notes: Optional[str] = None,
        # System fields
        is_active: bool = True,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        deactivated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = customer_id or generate_id()
        self.tenant_id = tenant_id
        self.code = self._normalize_code(code)
        self.name = self._normalize_name(name)
        
        # Vo Integration
        self.contact_info = contact_info or ContactInfo()
        self.address = address or Address()
        
        self.business_name = business_name.strip() if business_name else None
        
        # Customer Profile
        self.date_of_birth = date_of_birth
        self.gender = gender.strip() if gender else None
        self.nationality = nationality.strip() if nationality else None
        self.id_number = id_number.strip() if id_number else None
        self.id_type = id_type.strip() if id_type else None
        
        # Account Management
        self.account_manager_id = account_manager_id
        self.sales_representative_id = sales_representative_id
        self.customer_since = customer_since or now
        self.last_purchase_date = last_purchase_date
        self.total_purchase_amount = total_purchase_amount
        self.last_contact_date = last_contact_date
        
        # Preferences & Settings
        self.event_preferences = event_preferences.strip() if event_preferences else None
        self.seating_preferences = seating_preferences.strip() if seating_preferences else None
        self.accessibility_needs = accessibility_needs.strip() if accessibility_needs else None
        self.dietary_restrictions = dietary_restrictions.strip() if dietary_restrictions else None
        self.emergency_contact_name = emergency_contact_name.strip() if emergency_contact_name else None
        self.emergency_contact_phone = emergency_contact_phone.strip() if emergency_contact_phone else None
        self.emergency_contact_relationship = emergency_contact_relationship.strip() if emergency_contact_relationship else None
        self.preferred_language = preferred_language.strip() if preferred_language else None
        self.marketing_opt_in = marketing_opt_in
        self.email_marketing = email_marketing
        self.sms_marketing = sms_marketing
        
        # Social & Online
        self.facebook_url = facebook_url.strip() if facebook_url else None
        self.twitter_handle = twitter_handle.strip() if twitter_handle else None
        self.linkedin_url = linkedin_url.strip() if linkedin_url else None
        self.instagram_handle = instagram_handle.strip() if instagram_handle else None
        self.website = website.strip() if website else None
        
        # Tags & Classification
        self.tags = tags or []
        self.status_reason = status_reason.strip() if status_reason else None
        self.notes = notes.strip() if notes else None
        self.public_notes = public_notes.strip() if public_notes else None

        self.is_active = is_active
        self.deactivated_at = deactivated_at
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now

        self._validate()

    def update_details(
        self,
        *,
        code: Optional[str] = None,
        name: Optional[str] = None,
        contact_info: Optional[ContactInfo] = None,
        business_name: Optional[str] = None,
        address: Optional[Address] = None,
        date_of_birth: Optional[date] = None,
        gender: Optional[str] = None,
        nationality: Optional[str] = None,
        id_number: Optional[str] = None,
        id_type: Optional[str] = None,
        account_manager_id: Optional[str] = None,
        sales_representative_id: Optional[str] = None,
        event_preferences: Optional[str] = None,
        seating_preferences: Optional[str] = None,
        accessibility_needs: Optional[str] = None,
        dietary_restrictions: Optional[str] = None,
        emergency_contact_name: Optional[str] = None,
        emergency_contact_phone: Optional[str] = None,
        emergency_contact_relationship: Optional[str] = None,
        preferred_language: Optional[str] = None,
        marketing_opt_in: Optional[bool] = None,
        email_marketing: Optional[bool] = None,
        sms_marketing: Optional[bool] = None,
        facebook_url: Optional[str] = None,
        twitter_handle: Optional[str] = None,
        linkedin_url: Optional[str] = None,
        instagram_handle: Optional[str] = None,
        website: Optional[str] = None,
        tags: Optional[List[str]] = None,
        status_reason: Optional[str] = None,
        notes: Optional[str] = None,
        public_notes: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ) -> None:
        """Update customer master data with validation."""
        if code is not None:
            self.code = self._normalize_code(code)
        if name is not None:
            self.name = self._normalize_name(name)
        if contact_info is not None:
            self.contact_info = contact_info
        if address is not None:
            self.address = address
        if business_name is not None:
            self.business_name = business_name.strip() if business_name else None
        if date_of_birth is not None:
            self.date_of_birth = date_of_birth
        if gender is not None:
            self.gender = gender.strip() if gender else None
        if nationality is not None:
            self.nationality = nationality.strip() if nationality else None
        if id_number is not None:
            self.id_number = id_number.strip() if id_number else None
        if id_type is not None:
            self.id_type = id_type.strip() if id_type else None
        if account_manager_id is not None:
            self.account_manager_id = account_manager_id
        if sales_representative_id is not None:
            self.sales_representative_id = sales_representative_id
        if event_preferences is not None:
            self.event_preferences = event_preferences.strip() if event_preferences else None
        if seating_preferences is not None:
            self.seating_preferences = seating_preferences.strip() if seating_preferences else None
        if accessibility_needs is not None:
            self.accessibility_needs = accessibility_needs.strip() if accessibility_needs else None
        if dietary_restrictions is not None:
            self.dietary_restrictions = dietary_restrictions.strip() if dietary_restrictions else None
        if emergency_contact_name is not None:
            self.emergency_contact_name = emergency_contact_name.strip() if emergency_contact_name else None
        if emergency_contact_phone is not None:
            self.emergency_contact_phone = emergency_contact_phone.strip() if emergency_contact_phone else None
        if emergency_contact_relationship is not None:
            self.emergency_contact_relationship = emergency_contact_relationship.strip() if emergency_contact_relationship else None
        if preferred_language is not None:
            self.preferred_language = preferred_language.strip() if preferred_language else None
        if marketing_opt_in is not None:
            self.marketing_opt_in = marketing_opt_in
        if email_marketing is not None:
            self.email_marketing = email_marketing
        if sms_marketing is not None:
            self.sms_marketing = sms_marketing
        if facebook_url is not None:
            self.facebook_url = facebook_url.strip() if facebook_url else None
        if twitter_handle is not None:
            self.twitter_handle = twitter_handle.strip() if twitter_handle else None
        if linkedin_url is not None:
            self.linkedin_url = linkedin_url.strip() if linkedin_url else None
        if instagram_handle is not None:
            self.instagram_handle = instagram_handle.strip() if instagram_handle else None
        if website is not None:
            self.website = website.strip() if website else None
        if tags is not None:
            self.tags = tags
        if status_reason is not None:
            self.status_reason = status_reason.strip() if status_reason else None
        if notes is not None:
            self.notes = notes.strip() if notes else None
        if public_notes is not None:
            self.public_notes = public_notes.strip() if public_notes else None
        if created_at is not None:
            self.created_at = created_at
        if updated_at is not None:
            self.updated_at = updated_at
        self._validate()
        self._touch()

    def activate(self) -> None:
        if self.is_active:
            return
        self.is_active = True
        self.deactivated_at = None
        self._touch()

    def deactivate(self) -> None:
        if not self.is_active:
            return
        self.is_active = False
        self.deactivated_at = datetime.now(timezone.utc)
        self._touch()

    def _normalize_code(self, code: str) -> str:
        if not code or not code.strip():
            raise ValidationError("Customer code is required")
        normalized = code.strip().upper()
        if len(normalized) > 50:
            raise ValidationError("Customer code cannot exceed 50 characters")
        return normalized

    def _normalize_name(self, name: str) -> str:
        if not name or not name.strip():
            raise ValidationError("Customer name is required")
        return name.strip()

    def _validate(self) -> None:
        """Validate customer data."""

        pass

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()

def ensure_same_tenant(customer: Customer, tenant_id: str) -> None:
    if customer.tenant_id != tenant_id:
        raise BusinessRuleError("Customer tenant mismatch")
