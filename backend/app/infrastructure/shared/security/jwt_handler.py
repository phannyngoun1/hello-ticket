"""
JWT token handling for OpenID Connect compatibility
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Any
from jose import JWTError, jwt
import os


class JWTHandler:
    """JWT token creation and validation"""
    
    def __init__(
        self,
        secret_key: Optional[str] = None,
        algorithm: str = "HS256",
        access_token_expire_minutes: int = 30,
        refresh_token_expire_days: int = 7
    ):
        self._secret_key = secret_key or os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
        self._algorithm = algorithm
        self._access_token_expire_minutes = access_token_expire_minutes
        self._refresh_token_expire_days = refresh_token_expire_days
    
    def create_access_token(
        self, 
        subject: str, 
        additional_claims: Optional[Dict[str, Any]] = None,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token (OpenID Connect compatible)
        
        Args:
            subject: Token subject (usually user_id)
            additional_claims: Additional claims to include (roles, permissions, etc.)
            expires_delta: Custom expiration time
            
        Returns:
            Encoded JWT token
        """
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=self._access_token_expire_minutes)
        
        # OpenID Connect standard claims
        to_encode = {
            "sub": subject,  # Subject (user identifier)
            "exp": expire,   # Expiration time
            "iat": datetime.now(timezone.utc),  # Issued at
            "type": "access"  # Token type
        }
        
        # Add additional claims (roles, permissions, etc.)
        if additional_claims:
            to_encode.update(additional_claims)
        
        return jwt.encode(to_encode, self._secret_key, algorithm=self._algorithm)
    
    def create_refresh_token(
        self, 
        subject: str,
        additional_claims: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create JWT refresh token
        
        Args:
            subject: Token subject (usually user_id)
            additional_claims: Additional claims to include (session_id, etc.)
            
        Returns:
            Encoded JWT refresh token
        """
        expire = datetime.now(timezone.utc) + timedelta(days=self._refresh_token_expire_days)
        
        to_encode = {
            "sub": subject,
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "refresh"
        }
        
        # Add additional claims
        if additional_claims:
            to_encode.update(additional_claims)
        
        return jwt.encode(to_encode, self._secret_key, algorithm=self._algorithm)
    
    def create_id_token(
        self,
        subject: str,
        audience: str,
        user_info: Dict[str, Any]
    ) -> str:
        """Create OpenID Connect ID token
        
        Args:
            subject: Token subject (user_id)
            audience: Token audience (client_id)
            user_info: User information (email, name, etc.)
            
        Returns:
            Encoded ID token
        """
        expire = datetime.now(timezone.utc) + timedelta(minutes=self._access_token_expire_minutes)
        
        # OpenID Connect ID token standard claims
        to_encode = {
            "sub": subject,
            "aud": audience,
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "iss": os.getenv("ISSUER", "https://your-domain.com"),  # Issuer
            **user_info  # email, name, etc.
        }
        
        return jwt.encode(to_encode, self._secret_key, algorithm=self._algorithm)
    
    def decode_token(self, token: str) -> Dict[str, Any]:
        """Decode and validate JWT token
        
        Args:
            token: JWT token to decode
            
        Returns:
            Decoded token payload
            
        Raises:
            JWTError: If token is invalid or expired
        """
        return jwt.decode(token, self._secret_key, algorithms=[self._algorithm])
    
    def verify_token(self, token: str) -> Optional[str]:
        """Verify token and return subject
        
        Args:
            token: JWT token to verify
            
        Returns:
            Token subject (user_id) if valid, None otherwise
        """
        try:
            payload = self.decode_token(token)
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            return user_id
        except JWTError:
            return None

