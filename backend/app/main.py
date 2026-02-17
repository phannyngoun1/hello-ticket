"""
Main FastAPI application entry point

Author: Phanny
"""
import os
import logging
import warnings
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Suppress pkg_resources deprecation warning from punq
# This is a known issue in punq 0.6.2, waiting for upstream fix
# Filter by module path to catch the warning from punq/__init__.py
warnings.filterwarnings("ignore", category=UserWarning, module="punq")
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from app.presentation.router_registry import register_routers
from app.presentation.exception_handlers import register_exception_handlers
from app.presentation.middleware.tenant_middleware import TenantMiddleware
from app.presentation.middleware.session_middleware import SessionValidationMiddleware
from app.presentation.middleware.audit_middleware import AuditMiddleware

# Load environment variables from .env file
load_dotenv()

# Log level: DEBUG for issue tracking, INFO default, WARNING/ERROR to reduce noise
# Set LOG_LEVEL=DEBUG or ENABLE_DEBUG_LOG=true in production to troubleshoot issues
_log_level_name = (
    os.getenv("LOG_LEVEL", "").upper()
    or ("DEBUG" if os.getenv("ENABLE_DEBUG_LOG", "").lower() == "true" else "INFO")
)
_log_level = getattr(logging, _log_level_name, logging.INFO)

logging.basicConfig(
    level=_log_level,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
    handlers=[logging.StreamHandler()],
)


class SuppressASGITracebackFilter(logging.Filter):
    """
    Remove verbose tracebacks emitted by uvicorn loggers (they are
    persisted separately by ErrorLoggingMiddleware).
    """

    def __init__(self, *logger_prefixes: str):
        super().__init__()
        self._logger_prefixes = logger_prefixes or (
            "uvicorn.error",
            "uvicorn.protocols.http",
            "uvicorn.protocols.websockets",
        )

    def filter(self, record: logging.LogRecord) -> bool:
        if record.name.startswith(self._logger_prefixes):
            if record.exc_info:
                return False
            msg = record.getMessage()
            if msg.startswith("Exception in ASGI application"):
                return False
        return True


traceback_filter = SuppressASGITracebackFilter()
for logger_name in (
    "uvicorn.error",
    "uvicorn.asgi",
    "uvicorn.protocols.http",
    "uvicorn.protocols.websockets",
):
    logging.getLogger(logger_name).addFilter(traceback_filter)

# Reduce SQLAlchemy verbosity (only show warnings and errors; DEBUG when ENABLE_DEBUG_LOG)
_sql_level = logging.DEBUG if _log_level <= logging.DEBUG else logging.WARNING
logging.getLogger('sqlalchemy.engine').setLevel(_sql_level)
logging.getLogger('sqlalchemy.pool').setLevel(_sql_level)
logging.getLogger('sqlalchemy.dialects').setLevel(_sql_level)
logging.getLogger('sqlalchemy.orm').setLevel(_sql_level)

# Disable uvicorn access log (we use ErrorLoggingMiddleware for request/response)
logging.getLogger('uvicorn.access').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    from app.startup import run_startup_tasks, run_shutdown_tasks
    
    # Startup
    await run_startup_tasks()
    
    yield
    
    # Shutdown
    await run_shutdown_tasks()


# Create FastAPI application
app = FastAPI(
    title="Hello Ticket API",
    description="""
    Hello Ticket - Modern REST API backend service with Hexagonal Architecture, CQRS, SQLModel, and OpenID Connect
    
    ## 🚀 Quick Start
    
    ### Testing Without Authentication
    Some endpoints are **public** and don't require authentication:
    - `POST /auth/register` - Create an account
    
    ### Testing With Authentication
    For protected endpoints (create, update, delete):
    
    1. **Set Tenant ID**: Click the **🔓 Authorize** button (top right)
    2. **Enter Tenant**: In the "TenantAuth (apiKey)" section, enter your `X-Tenant-ID` (e.g., "default-tenant")
    3. **OAuth2 Login**: In the "OAuth2PasswordBearer (OAuth2, password)" section, enter your username and password
    4. **Authorize**: Click **Authorize** for both
    5. **Test**: Now you can access all endpoints based on your role!
    
    ### Multi-Tenancy
    This API supports multi-tenancy via the `X-Tenant-ID` header:
    - Use the **Authorize** button to set it once for all requests
    - Or add it manually to each request header
    - Default tenant: `default-tenant` (configured in environment)
    
    ## 🏗️ Architecture
    
    This API follows clean architecture principles:
    - **Domain Layer**: Core business logic and entities
    - **Application Layer**: CQRS with commands and queries
    - **Infrastructure Layer**: Database, security, and integrations
    - **Presentation Layer**: API endpoints and validation
    """,
    version="0.1.0",
    lifespan=lifespan,
    swagger_ui_init_oauth={
        "clientId": "hello-ticket-api",
        "appName": "Hello Ticket API",
        "usePkceWithAuthorizationCodeGrant": True,
    },
    swagger_ui_parameters={
        "persistAuthorization": True,  # Persist authorization data in localStorage
    }
)


def custom_openapi():
    """Customize OpenAPI schema to add X-Tenant-ID header as a security scheme"""
    if app.openapi_schema:
        return app.openapi_schema
    
    from fastapi.openapi.utils import get_openapi
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add X-Tenant-ID as an API Key security scheme
    openapi_schema["components"]["securitySchemes"]["TenantAuth"] = {
        "type": "apiKey",
        "in": "header",
        "name": "X-Tenant-ID",
        "description": "Tenant identifier for multi-tenancy support. Use 'default-tenant' for testing."
    }
    
    # Keep existing OAuth2 scheme
    # Note: FastAPI automatically adds OAuth2PasswordBearer to securitySchemes
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


# Set custom OpenAPI schema
app.openapi = custom_openapi

# Add CORS middleware with environment-aware configuration
# Development: Allow all origins for easy testing
# Production: Use specific origins from ALLOWED_ORIGINS env variable
cors_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
if cors_origins == ["*"]:
    environment = os.getenv("ENVIRONMENT", "development")
    if environment == "production":
        logger.warning("⚠️  SECURITY: CORS allows all origins (*) in PRODUCTION!")
        logger.warning("   Set ALLOWED_ORIGINS in .env for production (e.g., https://app.example.com,https://api.example.com)")
    
    # When using wildcard origins, credentials must be False (browser security restriction)
    # For development, this is acceptable
    cors_allow_credentials = False
    logger.info("🌐 CORS: Using wildcard origins (*) with allow_credentials=False (required for wildcard)")
else:
    # When using specific origins, we can enable credentials
    cors_allow_credentials = True
    logger.info(f"🌐 CORS: Allowing specific origins: {cors_origins} with credentials enabled")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Tenant middleware for multi-tenancy support
# Set require_tenant=False for development to make it optional
# Set default_tenant_id for testing without headers
app.add_middleware(
    TenantMiddleware,
    require_tenant=os.getenv("REQUIRE_TENANT", "false").lower() == "true",
    default_tenant_id=os.getenv("DEFAULT_TENANT_ID", "default-tenant")
)


# Add Session validation middleware for session management
# Validates active sessions and tracks user activity
app.add_middleware(SessionValidationMiddleware)

# Add Audit middleware for request-scoped audit context
# Should be after tenant middleware to have tenant context available
app.add_middleware(AuditMiddleware)

# Add error logging middleware for comprehensive request/response tracking
from app.presentation.middleware.error_logging_middleware import ErrorLoggingMiddleware
app.add_middleware(ErrorLoggingMiddleware)

# Add rate limiting middleware (before compression to avoid compressing rate limit responses)
from app.presentation.middleware.rate_limiting_middleware import RateLimitingMiddleware
app.add_middleware(RateLimitingMiddleware)

# Add response cache middleware (before compression to cache before compression)
from app.presentation.middleware.response_cache_middleware import ResponseCacheMiddleware
app.add_middleware(ResponseCacheMiddleware)

# Add compression middleware (should be last to compress final responses)
from app.presentation.middleware.compression_middleware import CompressionMiddleware
app.add_middleware(CompressionMiddleware)


# Register global exception handlers
register_exception_handlers(app)

# Register all routers
register_routers(app)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Frontend dist path for combined production deployment (backend serves SPA)
# Set FRONTEND_DIST_DIR to override (e.g. in Docker: /app/frontend/dist)
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIST_DIR = os.getenv("FRONTEND_DIST_DIR") or str(_BACKEND_ROOT.parent / "frontend" / "apps" / "web" / "dist")
_frontend_path = Path(FRONTEND_DIST_DIR)
_serve_frontend = _frontend_path.is_dir() and (_frontend_path / "index.html").is_file()

if _serve_frontend:
    _assets_dir = _frontend_path / "assets"
    if _assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(_assets_dir)), name="frontend_assets")
    _spa_excluded_prefixes = ("api/", "api", "uploads/", "uploads", "docs", "redoc", "openapi.json", ".well-known/", ".well-known", "health/", "health")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve SPA index.html for non-API routes (client-side routing)."""
        if any(full_path == p or full_path.startswith(p + "/") for p in _spa_excluded_prefixes):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not Found")
        return FileResponse(_frontend_path / "index.html", media_type="text/html")
else:
    logger.info("Frontend dist not found at %s; running API-only mode. Set FRONTEND_DIST_DIR or build frontend for combined serve.", FRONTEND_DIST_DIR)


@app.get("/.well-known/appspecific/com.chrome.devtools.json")
async def chrome_devtools():
    """Chrome DevTools integration endpoint"""
    return {}


if not _serve_frontend:
    @app.get("/")
    async def root():
        """Root endpoint with getting started guide (API-only mode)."""
        return {
            "message": "Welcome to Hello Ticket API",
            "version": "0.1.0",
            "status": "running",
            "project": "hello-ticket",
            "database": "hello-ticket",
            "docs": "/docs",
            "openid_config": "/api/v1/auth/.well-known/openid-configuration",
            "getting_started": {
                "step_1": "View API documentation at /docs",
                "step_2": "Register a user at POST /api/v1/auth/register",
                "step_3": "Login at POST /api/v1/auth/token to get access token",
                "step_4": "Click 'Authorize' button in Swagger UI and enter your credentials",
                "step_5": "Test protected endpoints",
                "note": "Authentication is required for most endpoints"
            },
            "quick_test": {
                "register": {
                    "method": "POST",
                    "url": "/api/v1/auth/register",
                    "body": {
                        "username": "testuser",
                        "email": "test@example.com",
                        "password": "Test123!",
                        "name": "Test User",
                        "role": "user"
                    }
                },
                "login": {
                    "method": "POST",
                    "url": "/api/v1/auth/token",
                    "body": "username=testuser&password=Test123!",
                    "content_type": "application/x-www-form-urlencoded"
                }
            }
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        access_log=False,  # Use ErrorLoggingMiddleware for request logs
    )
