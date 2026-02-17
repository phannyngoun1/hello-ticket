"""
Tenant identification middleware for multi-tenancy
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.shared.tenant_context import set_tenant_context, clear_tenant_context
from app.shared.tenant_validator import validate_tenant_exists
from typing import Optional
import logging
import os
from jose import JWTError, jwt

logger = logging.getLogger(__name__)


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware to identify and set tenant context from request.
    
    Tenant identification strategies (in order of priority):
    1. Authorization token (JWT) - extracts tenant_id from access token (for authenticated requests)
    2. X-Tenant-ID header - explicit tenant identification
    3. X-Tenant-Slug header - user-friendly slug (requires database lookup)
    4. Subdomain - e.g., tenant1.example.com
    5. Query parameter - ?tenant_id=xxx
    6. Default tenant - from environment variable (development only)
    
    Hybrid Approach:
    - For authenticated requests: tenant_id is extracted from token (header optional)
    - For public endpoints: X-Tenant-ID header is required
    - If both token and header present: validates they match for security
    """
    
    def __init__(self, app, require_tenant: bool = True, default_tenant_id: Optional[str] = None, validate_tenant: bool = True):
        super().__init__(app)
        self.require_tenant = require_tenant
        self.default_tenant_id = default_tenant_id
        self.validate_tenant = validate_tenant  # Enable/disable tenant validation (useful for testing)
        self._secret_key = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    
    def _extract_tenant_from_token(self, request: Request) -> Optional[str]:
        """Extract tenant_id from Authorization token
        
        Args:
            request: FastAPI request object
            
        Returns:
            tenant_id from token if present and valid, None otherwise
        """
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, self._secret_key, algorithms=["HS256"])
            tenant_id = payload.get("tenant_id")
            return tenant_id
        except (JWTError, IndexError, AttributeError):
            # Token is invalid or doesn't contain tenant_id
            return None
    
    async def dispatch(self, request: Request, call_next):
        """Process request and identify tenant"""
        tenant_id = None
        tenant_from_token = None
        tenant_from_header = None
        
        # Strategy 1: Extract tenant from Authorization token (JWT)
        tenant_from_token = self._extract_tenant_from_token(request)
        if tenant_from_token:
            tenant_id = tenant_from_token
            logger.debug(f"Tenant '{tenant_id}' extracted from JWT token")
        
        # Strategy 2: Check X-Tenant-ID header
        tenant_from_header = request.headers.get("X-Tenant-ID")
        if not tenant_id and tenant_from_header:
            tenant_id = tenant_from_header
            logger.debug(f"Tenant '{tenant_id}' from X-Tenant-ID header")
        
        # Security: Validate token and header match if both present
        if tenant_from_token and tenant_from_header:
            if tenant_from_token != tenant_from_header:
                logger.warning(
                    f"Tenant mismatch! Token: '{tenant_from_token}', Header: '{tenant_from_header}'"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Tenant in Authorization token doesn't match X-Tenant-ID header. Please check your credentials."
                )
        
        # Strategy 3: Check X-Tenant-Slug header (would require database lookup)
        if not tenant_id:
            tenant_slug = request.headers.get("X-Tenant-Slug")
            if tenant_slug:
                # In production, you would look up tenant_id from slug
                # For now, we'll use the slug as the ID
                tenant_id = tenant_slug
                logger.debug(f"Tenant '{tenant_id}' from X-Tenant-Slug header")
        
        # Strategy 4: Check subdomain (skip for deployment platform hostnames)
        if not tenant_id:
            host = request.headers.get("host", "").split(":")[0]  # strip port
            # Don't use subdomain for Railway, Vercel, Heroku, Render, etc.
            # e.g. hello-ticket-production.up.railway.app should use default-tenant
            deployment_hosts = (
                "railway.app",
                "vercel.app",
                "herokuapp.com",
                "onrender.com",
                "netlify.app",
                "fly.dev",
            )
            if not any(h in host for h in deployment_hosts):
                parts = host.split(".")
                if len(parts) > 2:  # e.g., tenant1.api.example.com
                    tenant_id = parts[0]
                    logger.debug(f"Tenant '{tenant_id}' from subdomain")
        
        # Strategy 5: Check query parameter
        if not tenant_id:
            tenant_id = request.query_params.get("tenant_id")
            if tenant_id:
                logger.debug(f"Tenant '{tenant_id}' from query parameter")
        
        # Strategy 6: Use default tenant (for development)
        if not tenant_id and self.default_tenant_id:
            tenant_id = self.default_tenant_id
            logger.debug(f"Using default tenant '{tenant_id}'")
        
        # Validate tenant_id is present if required
        if self.require_tenant and not tenant_id:
            # Skip tenant requirement for certain paths
            path = request.url.path
            if not self._is_tenant_required_path(path):
                response = await call_next(request)
                return response
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant identification required. Please provide X-Tenant-ID header or use subdomain."
            )
        
        # Validate tenant exists in database
        if tenant_id and self.validate_tenant:
            # Skip validation for tenant management endpoints and public paths
            path = request.url.path
            if not path.startswith("/api/v1/tenants") and not self._is_public_path(path):
                if not validate_tenant_exists(tenant_id):
                    logger.warning(f"Request with invalid tenant_id: {tenant_id}")
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Tenant '{tenant_id}' not found. Please check your tenant ID or contact support."
                    )
        
        # Set tenant context
        if tenant_id:
            set_tenant_context(tenant_id)
        
        try:
            response = await call_next(request)
            return response
        finally:
            # Clear tenant context after request
            clear_tenant_context()
    
    def _is_tenant_required_path(self, path: str) -> bool:
        """Check if path requires tenant context"""
        # Paths that don't require tenant context
        exempt_paths = [
            "/",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/.well-known",
            "/api/v1/tenants",  # Tenant management endpoints
            "/api/v1/auth/register",  # Initial registration might not have tenant
            "/api/v1/management",  # Platform management endpoints (super admin) work across all tenants
        ]
        
        for exempt_path in exempt_paths:
            if path.startswith(exempt_path):
                return False
        
        return True
    
    def _is_public_path(self, path: str) -> bool:
        """Check if path is public and doesn't need tenant validation"""
        # Public paths that don't need tenant validation
        public_paths = [
            "/",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/.well-known",
            "/favicon.ico",
            "/api/v1/tenants",  # Tenant management endpoints
            "/api/v1/auth/register",  # Initial registration might not have tenant
            "/api/v1/management",  # Platform management endpoints (super admin) work across all tenants
        ]
        
        for public_path in public_paths:
            if path.startswith(public_path):
                return True
        
        return False

