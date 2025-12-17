"""
Session queries - CQRS pattern
"""
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class GetSessionQuery:
    """Query to get a session by ID"""
    session_id: str


@dataclass(frozen=True)
class GetUserSessionsQuery:
    """Query to get all sessions for a user"""
    user_id: str
    tenant_id: str
    active_only: bool = True


@dataclass(frozen=True)
class GetSessionInfoQuery:
    """Query to get detailed session information"""
    session_id: str


@dataclass(frozen=True)
class ValidateSessionQuery:
    """Query to validate if a session is active"""
    session_id: str


@dataclass(frozen=True)
class GetSessionsByDeviceTypeQuery:
    """Query to get sessions by device type"""
    user_id: str
    tenant_id: str
    device_type: str


@dataclass(frozen=True)
class GetSessionsByIPQuery:
    """Query to get sessions by IP address"""
    user_id: str
    tenant_id: str
    ip_address: str


@dataclass(frozen=True)
class CountActiveSessionsQuery:
    """Query to count active sessions for a user"""
    user_id: str
    tenant_id: str

