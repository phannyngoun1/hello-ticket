"""
Shared utility functions
"""
import logging
import os
import traceback
import uuid
from typing import Any, Dict, Optional

# Configure logger
logger = logging.getLogger(__name__)

# Environment mode (development, production, staging, etc.)
# Used to determine default behavior (auto-print traces vs silent)
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
IS_DEVELOPMENT = ENVIRONMENT == "development"

# Debug flag - can be enabled in ANY environment for troubleshooting
# In production, set DEBUG=true temporarily to investigate issues
DEBUG = os.getenv("DEBUG", "false").lower() in ["true", "1"]


def generate_id() -> str:
    """Generate a new unique ID"""
    return str(uuid.uuid4())


def validate_email(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def sanitize_string(value: str) -> str:
    """Sanitize string input"""
    return value.strip() if value else ""


def build_error_response(
    message: str,
    details: Optional[Dict[str, Any]] = None,
    code: str = "ERROR"
) -> Dict[str, Any]:
    """Build standardized error response"""
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or {}
        }
    }


def log_error(
    e: Exception,
    context: Optional[Dict[str, Any]] = None,
    log_level: str = "error",
    print_trace: Optional[bool] = None
) -> None:
    """
    Log detailed error information with proper logging.
    
    Args:
        e: The exception to log
        context: Optional dictionary with additional context (e.g., user_id, request_id)
        log_level: Logging level to use ('debug', 'info', 'warning', 'error', 'critical')
        print_trace: If True, prints formatted traceback to console. 
                     If None (default), auto-detects:
                       - Development (ENVIRONMENT=development): Always prints
                       - Production (ENVIRONMENT=production): Only if DEBUG=true
                     Set to False to suppress console output entirely.
    
    Example:
        try:
            # some code
        except Exception as e:
            log_error(e, context={"user_id": user_id, "action": "create_order"})
    
    Environment Variables:
        ENVIRONMENT: "development" (auto-print) or "production" (silent unless DEBUG=true)
        DEBUG: Set to "true" to enable traces in production for troubleshooting
    """
    # Auto-detect print_trace behavior if not explicitly specified
    if print_trace is None:
        # In development: always print traces
        # In production: only print if DEBUG=true (for troubleshooting)
        print_trace = IS_DEVELOPMENT or DEBUG
    
    # Build error details
    error_details = {
        "error_type": type(e).__name__,
        "error_message": str(e),
        "error_cause": str(e.__cause__) if e.__cause__ else None,
        "error_context": str(e.__context__) if e.__context__ else None,
    }
    
    # Add custom context if provided
    if context:
        error_details["custom_context"] = context
    
    # Print to console for immediate visibility in debug mode
    if print_trace:
        print("\n" + "="*80)
        print(f"🐛 ERROR LOGGED ({log_level.upper()})")
        print("="*80)
        print(f"Exception Type: {type(e).__name__}")
        print(f"Exception Message: {str(e)}")
        
        if context:
            print("\nContext:")
            for key, value in context.items():
                print(f"  {key}: {value}")
        
        if e.__cause__:
            print(f"\nCaused by: {e.__cause__}")
        
        print("\nFull Traceback:")
        print("-"*80)
        traceback.print_exc()
        print("="*80 + "\n")
    
    # Get the appropriate log method
    log_method = getattr(logger, log_level.lower(), logger.error)
    
    # Log with structured information
    log_method(
        f"Exception occurred: {type(e).__name__} - {str(e)}",
        exc_info=True,
        extra={
            "error_details": error_details,
            "traceback": traceback.format_exc()
        }
    )

