"""
Domain exceptions with error codes
"""
from typing import Any, Dict, Optional


class DomainException(Exception):
    """Base domain exception with error code support"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None, error_code: Optional[str] = None):
        self.message = message
        self.details = details or {}
        self.error_code = error_code or self._get_default_error_code()
        super().__init__(self.message)
    
    def _get_default_error_code(self) -> str:
        """Get default error code based on exception type"""
        return f"{self.__class__.__name__.upper()}"


class ValidationError(DomainException):
    """Raised when validation fails"""
    
    def _get_default_error_code(self) -> str:
        return "VALIDATION_ERROR"


class NotFoundError(DomainException):
    """Raised when a resource is not found"""
    
    def _get_default_error_code(self) -> str:
        return "NOT_FOUND"


class ConflictError(DomainException):
    """Raised when there's a conflict (e.g., duplicate resource)"""
    
    def _get_default_error_code(self) -> str:
        return "CONFLICT"


class BusinessRuleError(DomainException):
    """Raised when a business rule is violated"""
    
    def _get_default_error_code(self) -> str:
        return "BUSINESS_RULE_VIOLATION"


class AuthenticationError(DomainException):
    """Raised when authentication fails"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None, error_code: Optional[str] = None):
        super().__init__(message, details, error_code)
        self.headers = headers or {}
    
    def _get_default_error_code(self) -> str:
        return "AUTHENTICATION_ERROR"


class ConcurrencyError(DomainException):
    """Raised when a concurrency conflict occurs"""
    
    def _get_default_error_code(self) -> str:
        return "CONCURRENCY_ERROR"

