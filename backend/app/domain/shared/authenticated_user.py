"""
Authenticated User entity with security features
"""
from datetime import datetime, timezone
from typing import Optional, List, Set
from dataclasses import dataclass, field
from app.domain.shared.value_objects.email import Email
from app.domain.shared.value_objects.first_name import FirstName
from app.domain.shared.value_objects.last_name import LastName
from app.domain.shared.value_objects.role import UserRole, Permission, Role
from app.shared.utils import generate_id


@dataclass
class AuthenticatedUser:
    """
    User entity with authentication and authorization
    
    This user entity supports:
    - Base role (admin, manager, user, guest)
    - Group memberships (inherit permissions from groups)
    - Custom roles (additional roles with custom permissions)
    - Combined permissions from all sources
    """
    # Required fields (no defaults)
    username: str
    first_name: FirstName
    last_name: LastName
    email: Email
    hashed_password: str
    tenant_id: str  # Multi-tenancy support
    # Optional fields (with defaults)
    id: str = field(default_factory=generate_id)
    role: Role = field(default_factory=lambda: Role(UserRole.USER))
    is_active: bool = field(default=True)
    is_verified: bool = field(default=False)
    must_change_password: bool = field(default=False)  # Force password change on next login
    last_login: Optional[datetime] = field(default=None)
    last_password_change: Optional[datetime] = field(default=None)  # Track password changes
    failed_login_attempts: int = field(default=0)
    locked_until: Optional[datetime] = field(default=None)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Group and custom role permissions (loaded separately)
    group_permissions: List[str] = field(default_factory=list)
    custom_role_permissions: List[str] = field(default_factory=list)
    
    def update_name(self, new_first_name: FirstName, new_last_name: LastName) -> None:
        """Update user first and last names"""
        self.first_name = new_first_name
        self.last_name = new_last_name
        self.updated_at = datetime.now(timezone.utc)
    
    def update_email(self, new_email: Email) -> None:
        """Update user email"""
        self.email = new_email
        self.updated_at = datetime.now(timezone.utc)
    
    def update_password(self, new_hashed_password: str) -> None:
        """Update user password and track change"""
        self.hashed_password = new_hashed_password
        self.last_password_change = datetime.now(timezone.utc)
        self.must_change_password = False  # Clear flag after password change
        self.updated_at = datetime.now(timezone.utc)
    
    def require_password_change(self) -> None:
        """Force user to change password on next login"""
        self.must_change_password = True
        self.updated_at = datetime.now(timezone.utc)
    
    def change_role(self, new_role: Role) -> None:
        """Change user role"""
        self.role = new_role
        self.updated_at = datetime.now(timezone.utc)
    
    def deactivate(self) -> None:
        """Deactivate user account"""
        self.is_active = False
        self.updated_at = datetime.now(timezone.utc)
    
    def activate(self) -> None:
        """Activate user account"""
        self.is_active = True
        self.failed_login_attempts = 0
        self.locked_until = None
        self.updated_at = datetime.now(timezone.utc)
    
    def verify(self) -> None:
        """Verify user email"""
        self.is_verified = True
        self.updated_at = datetime.now(timezone.utc)
    
    def record_successful_login(self) -> None:
        """Record successful login"""
        self.last_login = datetime.now(timezone.utc)
        self.failed_login_attempts = 0
        self.locked_until = None
        self.updated_at = datetime.now(timezone.utc)
    
    def record_failed_login(self, max_attempts: int = 5, lockout_minutes: int = 30) -> None:
        """Record failed login attempt and lock account if needed"""
        self.failed_login_attempts += 1
        self.updated_at = datetime.now(timezone.utc)
        
        if self.failed_login_attempts >= max_attempts:
            from datetime import timedelta
            self.locked_until = datetime.now(timezone.utc) + timedelta(minutes=lockout_minutes)
    
    def is_locked(self) -> bool:
        """Check if account is locked"""
        if self.locked_until is None:
            return False
        return datetime.now(timezone.utc) < self.locked_until
    
    def can_authenticate(self) -> bool:
        """Check if user can authenticate (doesn't check password change requirement)"""
        return self.is_active and not self.is_locked()
    
    def needs_password_change(self) -> bool:
        """Check if user must change password"""
        return self.must_change_password
    
    def has_permission(self, permission: Permission) -> bool:
        """
        Check if user has specific permission
        
        Checks permissions from:
        1. Base role
        2. Group memberships
        3. Custom roles
        """
        if not self.is_active:
            return False
        
        # Check base role permissions
        if self.role.has_permission(permission):
            return True
        
        # Check group permissions
        if permission.value in self.group_permissions:
            return True
        
        # Check custom role permissions
        if permission.value in self.custom_role_permissions:
            return True
        
        return False
    
    def has_any_permission(self, permissions: List[Permission]) -> bool:
        """Check if user has any of the specified permissions"""
        if not self.is_active:
            return False
        return any(self.has_permission(perm) for perm in permissions)
    
    def has_all_permissions(self, permissions: List[Permission]) -> bool:
        """Check if user has all of the specified permissions"""
        if not self.is_active:
            return False
        return all(self.has_permission(perm) for perm in permissions)
    
    def get_permissions(self) -> Set[Permission]:
        """
        Get all permissions for this user
        
        Combines permissions from:
        1. Base role
        2. Group memberships
        3. Custom roles
        """
        if not self.is_active:
            return set()
        
        all_permissions = set(self.role.permissions)
        
        # Add group permissions
        for perm_str in self.group_permissions:
            try:
                all_permissions.add(Permission(perm_str))
            except ValueError:
                # Skip invalid permission strings
                pass
        
        # Add custom role permissions
        for perm_str in self.custom_role_permissions:
            try:
                all_permissions.add(Permission(perm_str))
            except ValueError:
                # Skip invalid permission strings
                pass
        
        return all_permissions
    
    def set_group_permissions(self, permissions: List[str]) -> None:
        """Set group permissions for this user"""
        self.group_permissions = permissions
    
    def set_custom_role_permissions(self, permissions: List[str]) -> None:
        """Set custom role permissions for this user"""
        self.custom_role_permissions = permissions
    
    def get_all_permission_strings(self) -> Set[str]:
        """Get all permission strings (for debugging/display)"""
        if not self.is_active:
            return set()
        
        all_perms = set()
        
        # Base role permissions
        for perm in self.role.permissions:
            all_perms.add(perm.value)
        
        # Group permissions
        all_perms.update(self.group_permissions)
        
        # Custom role permissions
        all_perms.update(self.custom_role_permissions)
        
        return all_perms
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, AuthenticatedUser):
            return False
        return self.id == other.id
    
    def __hash__(self) -> int:
        return hash(self.id)

