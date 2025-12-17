/**
 * Common types shared across account components
 */

export interface AccountProps {
    className?: string;
    children?: React.ReactNode;
}

export interface AccountLayoutProps extends AccountProps {
    variant?: 'default' | 'compact' | 'expanded';
    fullWidth?: boolean;
}

export interface AccountWithDataProps<T> extends AccountProps {
    data: T;
    loading?: boolean;
    error?: Error | null;
    onRetry?: () => void;
}

export interface AccountWithActionsProps extends AccountProps {
    actions?: React.ReactNode;
    onAction?: (action: string, data?: any) => void;
}

/**
 * User Types
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
    metadata?: Record<string, any>;
    // Detailed auth fields (from UserDetailResponse)
    isVerified?: boolean;
    mustChangePassword?: boolean;
    lastPasswordChange?: Date;
    failedLoginAttempts?: number;
    lockedUntil?: Date;
}

export interface CreateUserInput {
    email: string;
    password: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    baseRole?: string;
    tenantId?: string;
    metadata?: Record<string, any>;
}

export interface UpdateUserInput {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    role?: string;
    baseRole?: string;
    status?: User['status'];
    metadata?: Record<string, any>;
}

/**
 * Role Types
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

export interface Permission {
    id: string;
    name: string;
    description?: string;
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'execute';
    scope?: 'own' | 'team' | 'tenant' | 'global';
}

export interface AssignRoleInput {
    userId: string;
    roleId: string;
    expiresAt?: Date;
}

/**
 * Group Types
 */
export interface Group {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    memberCount?: number;
    roleCount?: number;
}

export interface CreateGroupInput {
    name: string;
    description?: string;
}

export interface UpdateGroupInput {
    name?: string;
    description?: string;
    isActive?: boolean;
}

/**
 * Profile Types
 */
export interface Profile extends User {
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
        notifications?: {
            email?: boolean;
            push?: boolean;
            sms?: boolean;
        };
    };
}

export interface UpdateProfileInput {
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string;
    bio?: string;
    phone?: string;
    location?: string;
    website?: string;
    socialLinks?: Profile['socialLinks'];
    preferences?: Profile['preferences'];
}

export interface ChangePasswordInput {
    oldPassword?: string;
    newPassword: string;
    confirmPassword: string;
}

/**
 * Activity Types
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
    eventType?: string;
    severity?: string;
}

/**
 * Filter and Pagination Types
 */
export interface UserFilter {
    search?: string;
    role?: string;
    status?: User['status'];
    tenantId?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}

export interface Pagination {
    page: number;
    pageSize: number;
    total?: number;
    totalPages?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: Pagination;
}

/**
 * Account Configuration
 */
export interface AccountConfig {
    theme?: 'light' | 'dark' | 'auto';
    locale?: string;
    apiEndpoint?: string;
    features?: {
        enableRoleManagement?: boolean;
        enablePermissions?: boolean;
        enableUserInvites?: boolean;
        enablePasswordChange?: boolean;
        enableProfileEdit?: boolean;
    };
}

/**
 * Account Context
 */
export interface AccountContext {
    config: AccountConfig;
    currentUser?: User;
    isAdmin?: boolean;
    canManageUsers?: boolean;
    canManageRoles?: boolean;
}

