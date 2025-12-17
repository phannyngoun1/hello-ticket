/**
 * Authentication and authorization types
 */

/**
 * User entity interface
 */
export interface User {
    id: string;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    role?: string;
    baseRole?: string;
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    lastLogin?: Date;
    createdAt: Date;
    updatedAt?: Date;
    tenantId?: string;
    permissions?: string[];
    metadata?: Record<string, unknown>;
}

/**
 * User session interface
 */
export interface Session {
    id: string;
    userId: string;
    token: string;
    refreshToken: string;
    expiresAt: Date;
    createdAt: Date;
    lastActivity: Date;
    ipAddress?: string;
    userAgent?: string;
    isActive: boolean;
}

/**
 * Session configuration
 */
export interface SessionConfig {
    idle_timeout_minutes: number;
    device_type: string;
}

/**
 * Permission interface
 */
export interface Permission {
    id: string;
    name: string;
    description?: string;
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'execute';
    scope?: 'own' | 'team' | 'tenant' | 'global';
}

/**
 * Role interface
 */
export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: Permission[];
    userCount?: number;
    isSystem?: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

/**
 * Authentication state
 */
export interface AuthState {
    isAuthenticated: boolean;
    user?: User;
    session?: Session;
    permissions: string[];
    roles: string[];
    isLoading: boolean;
    error?: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
    tenantId?: string;
}

/**
 * Registration data
 */
export interface RegisterData {
    email: string;
    password: string;
    confirmPassword: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    tenantId?: string;
    acceptTerms: boolean;
}

/**
 * Password change request
 */
export interface PasswordChangeRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
    email: string;
    tenantId?: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirm {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

/**
 * Token refresh request
 */
export interface TokenRefreshRequest {
    refreshToken: string;
}

/**
 * Token refresh response
 */
export interface TokenRefreshResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

/**
 * Multi-factor authentication
 */
export interface MfaSetup {
    secret: string;
    qrCode: string;
    backupCodes: string[];
}

/**
 * MFA verification
 */
export interface MfaVerification {
    code: string;
    backupCode?: string;
}

/**
 * Social login provider
 */
export interface SocialProvider {
    id: string;
    name: string;
    icon: string;
    enabled: boolean;
    clientId?: string;
}

/**
 * Social login request
 */
export interface SocialLoginRequest {
    provider: string;
    code: string;
    state?: string;
    tenantId?: string;
}

/**
 * User profile
 */
export interface UserProfile extends User {
    bio?: string;
    phone?: string;
    location?: string;
    website?: string;
    socialLinks?: {
        twitter?: string;
        linkedin?: string;
        github?: string;
    };
    preferences?: {
        theme?: 'light' | 'dark' | 'auto';
        language?: string;
        timezone?: string;
        notifications?: {
            email?: boolean;
            push?: boolean;
            sms?: boolean;
        };
    };
}

/**
 * Profile update request
 */
export interface ProfileUpdateRequest {
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string;
    bio?: string;
    phone?: string;
    location?: string;
    website?: string;
    socialLinks?: UserProfile['socialLinks'];
    preferences?: UserProfile['preferences'];
}

/**
 * User activity log
 */
export interface UserActivity {
    id: string;
    userId: string;
    action: string;
    resource?: string;
    resourceId?: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

/**
 * Tenant interface for multi-tenancy
 */
export interface Tenant {
    id: string;
    name: string;
    domain?: string;
    subdomain?: string;
    settings: Record<string, unknown>;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

/**
 * Permission check result
 */
export interface PermissionCheck {
    hasPermission: boolean;
    reason?: string;
    requiredPermission?: string;
}
