"""
Password hashing utilities using bcrypt
"""
import warnings
from passlib.context import CryptContext

# Suppress the crypt deprecation warning from passlib
warnings.filterwarnings("ignore", category=DeprecationWarning, module="passlib")


class PasswordHasher:
    """Secure password hashing using bcrypt"""
    
    def __init__(self):
        # Only use bcrypt scheme to avoid deprecated crypt module
        self._context = CryptContext(
            schemes=["bcrypt"],
            deprecated="auto",
            bcrypt__rounds=12  # Explicit bcrypt configuration
        )
    
    def hash(self, password: str) -> str:
        """Hash a password
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password
        """
        return self._context.hash(password)
    
    def verify(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash
        
        Args:
            plain_password: Plain text password to verify
            hashed_password: Hashed password to compare against
            
        Returns:
            True if password matches, False otherwise
        """
        return self._context.verify(plain_password, hashed_password)
    
    def needs_update(self, hashed_password: str) -> bool:
        """Check if password hash needs to be updated
        
        Args:
            hashed_password: Hashed password to check
            
        Returns:
            True if hash should be updated
        """
        return self._context.needs_update(hashed_password)

