"""Employee aggregate for Sales - Advanced CRUD with complex relationships."""
from __future__ import annotations

from datetime import datetime, timezone, date
from typing import Optional, Dict, Any, List
import re

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id


class Employee(AggregateRoot):
    """Represents a employee - advanced entity with complex relationships and business logic."""

    def __init__(
        self,
        tenant_id: str,
        code: str,
        name: str,
        employee_id: Optional[str] = None,
        
        # System Link
        user_id: Optional[str] = None,
        work_email: Optional[str] = None,
        
        # Organizational Structure
        job_title: Optional[str] = None,
        department: Optional[str] = None,
        employment_type: Optional[str] = None,
        hire_date: Optional[date] = None,
        
        # Contact & Location
        work_phone: Optional[str] = None,
        mobile_phone: Optional[str] = None,
        office_location: Optional[str] = None,
        employee_timezone: str = "UTC",
        
        # Sales & Operational
        skills: Optional[List[str]] = None,
        assigned_territories: Optional[List[str]] = None,
        quota_config: Optional[Dict[str, Any]] = None,
        commission_tier: Optional[str] = None,
        
        # Personal (HR)
        birthday: Optional[date] = None,
        emergency_contact_name: Optional[str] = None,
        emergency_contact_phone: Optional[str] = None,
        emergency_contact_relationship: Optional[str] = None,

        is_active: bool = True,
        attributes: Optional[Dict[str, Any]] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        deactivated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = employee_id or generate_id()
        self.tenant_id = tenant_id
        self.code = self._validate_code(code) if code else None
        self.name = self._validate_name(name)
        
        # System Link
        self.user_id = user_id
        self.work_email = self._validate_email(work_email) if work_email else None
        
        # Organizational Structure
        self.job_title = job_title
        self.department = department
        self.employment_type = employment_type
        self.hire_date = hire_date
        
        # Contact & Location
        self.work_phone = self._validate_phone(work_phone) if work_phone else None
        self.mobile_phone = self._validate_phone(mobile_phone) if mobile_phone else None
        self.office_location = office_location
        self.timezone = employee_timezone
        
        # Sales & Operational
        self.skills = skills or []
        self.assigned_territories = assigned_territories or []
        self.quota_config = quota_config or {}
        self.commission_tier = commission_tier
        
        # Personal (HR)
        self.birthday = birthday
        self.emergency_contact_name = emergency_contact_name
        self.emergency_contact_phone = self._validate_phone(emergency_contact_phone) if emergency_contact_phone else None
        self.emergency_contact_relationship = emergency_contact_relationship

        self.is_active = is_active
        self.attributes = attributes or {}
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
        user_id: Optional[str] = None,
        work_email: Optional[str] = None,
        job_title: Optional[str] = None,
        department: Optional[str] = None,
        employment_type: Optional[str] = None,
        hire_date: Optional[date] = None,
        work_phone: Optional[str] = None,
        mobile_phone: Optional[str] = None,
        office_location: Optional[str] = None,
        employee_timezone: Optional[str] = None,
        skills: Optional[List[str]] = None,
        assigned_territories: Optional[List[str]] = None,
        quota_config: Optional[Dict[str, Any]] = None,
        commission_tier: Optional[str] = None,
        birthday: Optional[date] = None,
        emergency_contact_name: Optional[str] = None,
        emergency_contact_phone: Optional[str] = None,
        emergency_contact_relationship: Optional[str] = None,
    ) -> None:
        """Update employee master data with validation."""
        if code is not None:
            self.code = self._validate_code(code)
        if name is not None:
            self.name = self._validate_name(name)
        if user_id is not None:
            self.user_id = user_id
        if work_email is not None:
            self.work_email = self._validate_email(work_email)
        if job_title is not None:
            self.job_title = job_title
        if department is not None:
            self.department = department
        if employment_type is not None:
            self.employment_type = employment_type
        if hire_date is not None:
            self.hire_date = hire_date
        if work_phone is not None:
            self.work_phone = self._validate_phone(work_phone)
        if mobile_phone is not None:
            self.mobile_phone = self._validate_phone(mobile_phone)
        if office_location is not None:
            self.office_location = office_location
        if employee_timezone is not None:
            self.timezone = employee_timezone
        if skills is not None:
            self.skills = skills
        if assigned_territories is not None:
            self.assigned_territories = assigned_territories
        if quota_config is not None:
            self.quota_config = quota_config
        if commission_tier is not None:
            self.commission_tier = commission_tier
        if birthday is not None:
            self.birthday = birthday
        if emergency_contact_name is not None:
            self.emergency_contact_name = emergency_contact_name
        if emergency_contact_phone is not None:
            self.emergency_contact_phone = self._validate_phone(emergency_contact_phone)
        if emergency_contact_relationship is not None:
            self.emergency_contact_relationship = emergency_contact_relationship

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

    def _validate_code(self, code: Optional[str]) -> Optional[str]:
        """Validate employee code format."""
        if code is None:
            return None
        if not code or not code.strip():
            raise ValidationError("Employee code cannot be empty if provided")
        code = code.strip().upper()
        if len(code) > 100:
            raise ValidationError("Employee code cannot exceed 100 characters")
        return code

    def _validate_name(self, name: str) -> str:
        """Validate employee name."""
        if not name or not name.strip():
            raise ValidationError("Employee name is required")
        return name.strip()
    
    def _validate_email(self, email: str) -> str:
        """Validate email format."""
        if not email or not email.strip():
            raise ValidationError("Email cannot be empty if provided")
        email = email.strip().lower()
        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise ValidationError("Invalid email format")
        return email
    
    def _validate_phone(self, phone: str) -> str:
        """Validate phone format (basic validation)."""
        if not phone or not phone.strip():
            raise ValidationError("Phone cannot be empty if provided")
        phone = phone.strip()
        # Remove common formatting characters for validation
        cleaned_phone = re.sub(r'[\s\-\(\)\+]', '', phone)
        if not cleaned_phone.isdigit() or len(cleaned_phone) < 7:
            raise ValidationError("Invalid phone format")
        return phone

    def _validate(self) -> None:
        """Validate employee data and business rules."""
        pass

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()


def ensure_same_tenant(employee: Employee, tenant_id: str) -> None:
    if employee.tenant_id != tenant_id:
        raise BusinessRuleError("Employee tenant mismatch")


