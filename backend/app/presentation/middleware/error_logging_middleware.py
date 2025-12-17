"""
Error logging middleware for comprehensive request/response/error tracking
"""
import logging
import os
import sys
import time
import traceback
from datetime import datetime
from pathlib import Path
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse

logger = logging.getLogger(__name__)

_APP_ROOT = Path(__file__).resolve().parents[3]
_DEFAULT_LOG_DIR = Path(
    os.environ.get("APP_LOG_DIR", str(_APP_ROOT / "logs"))
)
_ERROR_LOG_FILE = Path(
    os.environ.get("APP_ERROR_LOG_FILE", str(_DEFAULT_LOG_DIR / "errors.log"))
)
_ERROR_LOG_FILE.parent.mkdir(parents=True, exist_ok=True)


def _supports_color() -> bool:
    """Return True when the attached terminal can render ANSI colors."""
    stream = getattr(sys, "stderr", None) or getattr(sys, "stdout", None)
    return bool(
        stream
        and hasattr(stream, "isatty")
        and stream.isatty()
        and os.environ.get("NO_COLOR") is None
    )


_COLOR_ENABLED = _supports_color()


class AnsiColor:
    RESET = "\033[0m"
    DIM = "\033[2m"
    RED = "\033[31m"
    YELLOW = "\033[33m"
    CYAN = "\033[36m"
    MAGENTA = "\033[35m"
    BOLD_RED = "\033[1;31m"
    BOLD_CYAN = "\033[1;36m"
    BOLD_MAGENTA = "\033[1;35m"


def _colorize(text: str, color_code: str) -> str:
    """Wrap text in ANSI color codes when supported."""
    if not _COLOR_ENABLED:
        return text
    return f"{color_code}{text}{AnsiColor.RESET}"


def _format_traceback_preview(exc: Exception, max_frames: int = 3) -> str:
    """Return a concise preview focused on project files."""
    tb = traceback.extract_tb(exc.__traceback__)
    if not tb:
        return "  (no traceback available)"

    def _resolve_path(filename: str) -> Path:
        try:
            return Path(filename).resolve()
        except OSError:
            return Path(filename)

    frames_with_paths = [(frame, _resolve_path(frame.filename)) for frame in tb]
    project_frames = [
        (frame, path)
        for frame, path in frames_with_paths
        if str(path).startswith(str(_APP_ROOT))
    ]

    target_frames = project_frames or frames_with_paths
    target_frames = target_frames[-max_frames:]

    formatted = []
    for frame, abs_path in target_frames:
        rel_path = (
            abs_path.relative_to(_APP_ROOT)
            if hasattr(abs_path, "is_relative_to") and abs_path.is_relative_to(_APP_ROOT)
            else abs_path
        )
        location = f"{rel_path}:{frame.lineno}"
        formatted.append(
            f"  File {location} in {frame.name}\n"
            f"    {frame.line.strip() if frame.line else ''}"
        )
    return "\n".join(formatted)


def _write_full_traceback_to_file(context: dict, traceback_text: str) -> Path:
    """Persist the entire traceback to disk for later inspection."""
    timestamp = datetime.utcnow().isoformat()
    separator = "=" * 120
    context_lines = [
        f"timestamp: {timestamp}Z",
        f"path: {context['path']}",
        f"method: {context['method']}",
        f"status_code: {context['status_code']}",
        f"query_params: {context['query_params']}",
        f"tenant_id: {context['tenant_id']}",
        f"user_id: {context['user_id']}",
        f"client_ip: {context['client_ip']}",
        f"exception_type: {context['exception_type']}",
        f"exception_message: {context['exception_message']}",
    ]
    log_entry = (
        f"{separator}\n"
        + "\n".join(context_lines)
        + "\n"
        + f"{separator}\n"
        + traceback_text
        + "\n"
    )
    with _ERROR_LOG_FILE.open("a", encoding="utf-8") as log_file:
        log_file.write(log_entry)
    return _ERROR_LOG_FILE


class ErrorLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all requests, responses, and errors with structured logging
    
    Logs:
    - Request method, path, query params
    - Response status code, duration
    - Error details with context
    - Performance metrics
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log details"""
        start_time = time.time()
        
        # Extract request information
        method = request.method
        path = request.url.path
        query_params = dict(request.query_params)
        client_ip = request.client.host if request.client else "unknown"
        
        # Get tenant from context if available
        from app.shared.tenant_context import get_tenant_context
        tenant_id = get_tenant_context()
        
        # Get user from request state if available
        user_id = getattr(request.state, "user_id", None)
        
        # Log request
        logger.info(
            "Request started",
            extra={
                "type": "request",
                "method": method,
                "path": path,
                "query_params": query_params,
                "client_ip": client_ip,
                "tenant_id": tenant_id,
                "user_id": user_id,
            }
        )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Get response status code
            status_code = response.status_code
            
            # Log response
            log_level = "warning" if status_code >= 400 else "info"
            logger.log(
                logging.WARNING if log_level == "warning" else logging.INFO,
                "Request completed",
                extra={
                    "type": "response",
                    "method": method,
                    "path": path,
                    "status_code": status_code,
                    "duration_ms": round(duration * 1000, 2),
                    "client_ip": client_ip,
                    "tenant_id": tenant_id,
                    "user_id": user_id,
                }
            )
            
            # Add performance header
            if isinstance(response, Response):
                response.headers["X-Response-Time-Ms"] = str(round(duration * 1000, 2))
            
            return response
            
        except Exception as e:
            # Calculate duration
            duration = time.time() - start_time
            
            # Capture traceback once so we can store it without spamming the console
            full_traceback = "".join(
                traceback.format_exception(type(e), e, e.__traceback__)
            )

            # Persist complete traceback to disk
            traceback_path = _write_full_traceback_to_file(
                {
                    "path": str(request.url),
                    "method": method,
                    "status_code": 500,
                    "query_params": query_params,
                    "tenant_id": tenant_id,
                    "user_id": user_id,
                    "client_ip": client_ip,
                    "exception_type": type(e).__name__,
                    "exception_message": str(e),
                },
                full_traceback,
            )
            traceback_preview = _format_traceback_preview(e)

            # Log concise error summary to console with ANSI highlighting
            separator = "=" * 80
            colored_separator = _colorize(separator, AnsiColor.DIM)
            header = _colorize(
                f"🐛 ERROR LOGGED ({type(e).__name__})", AnsiColor.BOLD_RED
            )
            error_details = f"\n{colored_separator}\n{header}\n{colored_separator}\n"
            error_details += (
                f"{_colorize('Exception Type:', AnsiColor.YELLOW)} {type(e).__name__}\n"
            )
            error_details += (
                f"{_colorize('Exception Message:', AnsiColor.YELLOW)} {str(e)}\n\n"
            )
            error_details += f"{_colorize('Context:', AnsiColor.BOLD_CYAN)}\n"
            error_details += f"  path: {request.url}\n"
            error_details += f"  method: {method}\n"
            error_details += f"  status_code: 500\n"
            error_details += (
                f"  endpoint: {request.scope.get('endpoint', 'unknown')}\n"
            )
            error_details += f"  error_message: {str(e)}\n\n"
            error_details += (
                f"{_colorize('Traceback Preview:', AnsiColor.BOLD_MAGENTA)}\n"
                f"{traceback_preview}\n\n"
                f"{_colorize('Full Traceback saved to:', AnsiColor.BOLD_MAGENTA)} "
                f"{traceback_path}\n"
                f"{colored_separator}"
            )

            logger.error(
                error_details,
                extra={
                    "type": "error",
                    "method": method,
                    "path": path,
                    "query_params": query_params,
                    "duration_ms": round(duration * 1000, 2),
                    "client_ip": client_ip,
                    "tenant_id": tenant_id,
                    "user_id": user_id,
                    "exception_type": type(e).__name__,
                    "exception_message": str(e),
                }
            )
            
            # Re-raise exception (let exception handlers deal with it)
            raise

