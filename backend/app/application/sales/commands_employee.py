"""Sales commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateEmployeeCommand:
    """Command to create a new employee"""

    name: str
    code: Optional[str] = None

    # System Link
    user_id: Optional[str] = None
    work_email: Optional[str] = None

    # Organizational Structure
    job_title: Optional[str] = None
    department: Optional[str] = None
    employment_type: Optional[str] = None
    hire_date: Optional[str] = None

    # Contact & Location
    work_phone: Optional[str] = None
    mobile_phone: Optional[str] = None
    office_location: Optional[str] = None
    timezone: Optional[str] = None

    # Sales & Operational
    skills: Optional[list[str]] = None
    assigned_territories: Optional[list[str]] = None
    quota_config: Optional[dict] = None
    commission_tier: Optional[str] = None

    # Personal (HR)
    birthday: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None


@dataclass
class UpdateEmployeeCommand:
    """Command to update employee details"""

    employee_id: str
    name: Optional[str] = None
    code: Optional[str] = None

    # System Link
    user_id: Optional[str] = None
    work_email: Optional[str] = None

    # Organizational Structure
    job_title: Optional[str] = None
    department: Optional[str] = None
    employment_type: Optional[str] = None
    hire_date: Optional[str] = None

    # Contact & Location
    work_phone: Optional[str] = None
    mobile_phone: Optional[str] = None
    office_location: Optional[str] = None
    timezone: Optional[str] = None

    # Sales & Operational
    skills: Optional[list[str]] = None
    assigned_territories: Optional[list[str]] = None
    quota_config: Optional[dict] = None
    commission_tier: Optional[str] = None

    # Personal (HR)
    birthday: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None


@dataclass
class DeleteEmployeeCommand:
    """Command to remove a employee (soft-delete only)"""

    employee_id: str



