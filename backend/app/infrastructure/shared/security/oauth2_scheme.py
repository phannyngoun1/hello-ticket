"""
OAuth2 schemes for FastAPI dependency injection
"""
from fastapi.security import OAuth2PasswordBearer


# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/token",
    scheme_name="OAuth2PasswordBearer",
    description="OAuth2 password bearer authentication"
)


# OpenID Connect discovery endpoint (for OAuth2 clients)
OPENID_CONFIGURATION = {
    "issuer": "https://your-domain.com",
    "authorization_endpoint": "/api/v1/auth/authorize",
    "token_endpoint": "/api/v1/auth/token",
    "userinfo_endpoint": "/api/v1/auth/userinfo",
    "jwks_uri": "/api/v1/auth/.well-known/jwks.json",
    "response_types_supported": ["code", "token", "id_token"],
    "subject_types_supported": ["public"],
    "id_token_signing_alg_values_supported": ["HS256", "RS256"],
    "scopes_supported": ["openid", "profile", "email"],
    "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
    "claims_supported": ["sub", "iss", "aud", "exp", "iat", "email", "name", "roles"]
}

