"""
Session status value object
"""
from enum import Enum


class SessionStatus(str, Enum):
    """Session status enumeration"""
    ACTIVE = "active"  # Session is currently active
    EXPIRED = "expired"  # Session has expired naturally
    REVOKED = "revoked"  # Session was manually revoked/logged out
    FORCE_LOGOUT = "force_logout"  # Session was force logged out by admin or user
    DEVICE_RESTRICTED = "device_restricted"  # Session terminated due to device restriction
    MAX_SESSIONS_EXCEEDED = "max_sessions_exceeded"  # Session terminated due to max sessions limit

