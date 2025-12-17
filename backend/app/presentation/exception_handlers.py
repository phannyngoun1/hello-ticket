"""
Global exception handlers for FastAPI
Converts domain exceptions to appropriate HTTP responses

Author: Phanny
"""
import logging
import os
import traceback
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.shared.exceptions import (
    NotFoundError,
    BusinessRuleError,
    ValidationError,
    DomainException,
    AuthenticationError
)
from app.shared.mediator import NoHandlerRegisteredException
from app.shared.utils import log_error, DEBUG, IS_DEVELOPMENT

logger = logging.getLogger(__name__)


async def not_found_exception_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    """Handle NotFoundError - 404
    
    404 errors are expected client errors (resource not found), not application bugs.
    We log them at info level without full tracebacks to keep logs clean.
    """
    # Log at info level without traceback - 404s are expected client errors
    logger.info(f"404 Not Found: {str(exc)} - Path: {request.url} - Error Code: {exc.error_code}")
    
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": "Not Found",
            "error_code": exc.error_code,
            "message": str(exc),
            "path": str(request.url),
            "details": exc.details if exc.details else {}
        }
    )


async def validation_exception_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """Handle ValidationError - 400"""
    log_error(exc, context={"path": str(request.url), "status_code": 400, "error_code": exc.error_code}, log_level="warning")
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "Validation Error",
            "error_code": exc.error_code,
            "message": str(exc),
            "path": str(request.url),
            "details": exc.details if exc.details else {}
        }
    )


async def business_rule_exception_handler(request: Request, exc: BusinessRuleError) -> JSONResponse:
    """Handle BusinessRuleError - 400 or 409"""
    log_error(exc, context={"path": str(request.url), "status_code": 409, "error_code": exc.error_code}, log_level="warning")
    
    # Use 409 Conflict for business rule violations
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "error": "Business Rule Violation",
            "error_code": exc.error_code,
            "message": str(exc),
            "path": str(request.url),
            "details": exc.details if exc.details else {}
        }
    )


async def authentication_exception_handler(request: Request, exc: AuthenticationError) -> JSONResponse:
    """Handle AuthenticationError - 401 with WWW-Authenticate header"""
    log_error(exc, context={"path": str(request.url), "status_code": 401, "error_code": exc.error_code}, log_level="warning")
    
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "error": "Authentication Error",
            "error_code": exc.error_code,
            "message": str(exc),
            "path": str(request.url),
            "details": exc.details if exc.details else {}
        },
        headers=exc.headers
    )


async def no_handler_registered_exception_handler(
    request: Request, 
    exc: NoHandlerRegisteredException
) -> JSONResponse:
    """Handle NoHandlerRegisteredException - 500 (configuration error)"""
    log_error(exc, context={"path": str(request.url), "status_code": 500}, log_level="critical")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "Handler configuration error. Please contact support.",
            "path": str(request.url)
        }
    )


async def domain_exception_handler(request: Request, exc: DomainException) -> JSONResponse:
    """Handle generic DomainException - 400"""
    log_error(exc, context={"path": str(request.url), "status_code": 400, "error_code": exc.error_code})
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "Domain Error",
            "error_code": exc.error_code,
            "message": str(exc),
            "path": str(request.url),
            "details": exc.details if exc.details else {}
        }
    )


async def value_error_exception_handler(request: Request, exc: ValueError) -> JSONResponse:
    """Handle ValueError - 400"""
    log_error(exc, context={"path": str(request.url), "status_code": 400, "error_code": "VALIDATION_ERROR"})
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "Invalid Value",
            "error_code": "VALIDATION_ERROR",
            "message": str(exc),
            "path": str(request.url),
            "details": {}
        }
    )


async def http_exception_handler(request: Request, exc) -> JSONResponse:
    """Handle HTTPException (including 403, etc.) with traceback in dev mode"""
    from fastapi.exceptions import HTTPException as FastAPIHTTPException
    
    # Type check
    if not isinstance(exc, FastAPIHTTPException):
        # Fallback to generic handler if not HTTPException
        return await generic_exception_handler(request, exc)
    
    # Log with traceback in dev mode
    # Use warning level for client errors (4xx), error for server errors (5xx)
    log_level = "warning" if 400 <= exc.status_code < 500 else "error"
    
    # In dev mode, log with full traceback to see where HTTPException was raised
    log_error(
        exc,
        context={
            "path": str(request.url),
            "method": request.method,
            "status_code": exc.status_code,
            "endpoint": "http_exception",
            "error_message": exc.detail,
        },
        log_level=log_level
        # print_trace is auto-detected from DEBUG/IS_DEVELOPMENT
    )
    
    # Build response content
    show_details = IS_DEVELOPMENT or DEBUG
    
    content = {
        "error": "HTTP Exception",
        "message": exc.detail,
        "path": str(request.url),
        "type": type(exc).__name__,
        "status_code": exc.status_code
    }
    
    # Add traceback when showing details (development or DEBUG=true)
    if show_details:
        # Try to get traceback - HTTPException might not preserve original traceback
        import sys
        try:
            # Try to format current exception traceback
            tb_lines = traceback.format_exc().split("\n")
            if tb_lines and any("HTTPException" in line for line in tb_lines):
                content["traceback"] = tb_lines
            else:
                # If no useful traceback, show call stack to see where handler was called from
                content["traceback"] = traceback.format_stack()
        except Exception:
            # Fallback: show call stack
            content["traceback"] = traceback.format_stack()
        
        content["details"] = {
            "exception_type": type(exc).__name__,
            "exception_module": type(exc).__module__,
            "error_message": exc.detail,
            "http_status_code": exc.status_code,
            "headers": exc.headers if hasattr(exc, 'headers') else None,
        }
    
    return JSONResponse(
        status_code=exc.status_code,
        content=content,
        headers=exc.headers if hasattr(exc, 'headers') else None
    )


async def request_validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle RequestValidationError - 422 (Pydantic validation errors)"""
    log_error(
        exc, 
        context={
            "path": str(request.url),
            "method": request.method,
            "status_code": 422,
            "endpoint": "request_validation",
            "validation_errors": exc.errors()
        }
    )
    
    # Build response content - show validation details
    show_details = IS_DEVELOPMENT or DEBUG
    
    content = {
        "error": "Request Validation Error",
        "message": "One or more fields in the request are invalid",
        "path": str(request.url),
        "type": "RequestValidationError",
        "status_code": 422
    }
    
    # Add detailed validation errors
    if show_details:
        content["detail"] = exc.errors()
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=content
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all unhandled exceptions - 500
    
    In debug mode, returns full traceback for easier debugging.
    In production, returns generic error message.
    """
    # Extract error message - HTTPException uses 'detail', others use str()
    from fastapi.exceptions import HTTPException as FastAPIHTTPException
    
    if isinstance(exc, FastAPIHTTPException):
        error_message = exc.detail
        status_code = exc.status_code
        error_type = "HTTP Exception"
    else:
        error_message = str(exc) or f"{type(exc).__name__} occurred"
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        error_type = "Internal Server Error"
    
    # Log the error with full traceback and console output
    # Automatically prints to console when DEBUG=true in .env
    log_error(
        exc, 
        context={
            "path": str(request.url),
            "method": request.method,
            "status_code": status_code,
            "endpoint": "unhandled_exception",
            "error_message": error_message
        },
        log_level="error"
        # print_trace is auto-detected from DEBUG environment variable
    )
    
    # Build response content
    # Show detailed errors in development OR when DEBUG is enabled in production
    show_details = IS_DEVELOPMENT or DEBUG
    
    content = {
        "error": error_type,
        "message": error_message if show_details else "An unexpected error occurred. Please contact support.",
        "path": str(request.url),
        "type": type(exc).__name__,
        "status_code": status_code
    }
    
    # Add traceback when showing details (development or DEBUG=true)
    if show_details:
        content["traceback"] = traceback.format_exc().split("\n")
        content["details"] = {
            "exception_type": type(exc).__name__,
            "exception_module": type(exc).__module__,
            "error_message": error_message,
        }
        
        # Add HTTPException specific details
        if isinstance(exc, FastAPIHTTPException):
            content["details"]["http_status_code"] = exc.status_code
            content["details"]["headers"] = exc.headers if hasattr(exc, 'headers') else None
    
    return JSONResponse(
        status_code=status_code,
        content=content
    )


def register_exception_handlers(app):
    """
    Register all exception handlers with the FastAPI application
    
    Args:
        app: FastAPI application instance
    """
    # Domain-specific exceptions
    app.add_exception_handler(NotFoundError, not_found_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    app.add_exception_handler(BusinessRuleError, business_rule_exception_handler)
    app.add_exception_handler(AuthenticationError, authentication_exception_handler)
    app.add_exception_handler(DomainException, domain_exception_handler)
    
    # Mediator exceptions
    app.add_exception_handler(NoHandlerRegisteredException, no_handler_registered_exception_handler)
    
    # Python built-in exceptions
    app.add_exception_handler(ValueError, value_error_exception_handler)
    
    # FastAPI exceptions (must be before generic handler)
    app.add_exception_handler(RequestValidationError, request_validation_exception_handler)
    
    # HTTPException handler (for 403, etc.) - must be before generic handler
    from fastapi.exceptions import HTTPException
    app.add_exception_handler(HTTPException, http_exception_handler)
    
    # Catch-all for unhandled exceptions (must be last)
    # This provides detailed error info in debug mode
    app.add_exception_handler(Exception, generic_exception_handler)
    
    # Show startup message
    if IS_DEVELOPMENT:
        logger.info(f"🔧 Environment: DEVELOPMENT - Error traces enabled by default")
    elif DEBUG:
        logger.info(f"🐛 Environment: PRODUCTION - DEBUG mode enabled for troubleshooting")
    else:
        logger.info(f"🚀 Environment: PRODUCTION - Error traces disabled")

