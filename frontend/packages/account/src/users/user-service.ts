/**
 * User Service
 * 
 * Encapsulates all user-related API operations
 * Handles data transformation between backend and frontend types
 *
 * @author Phanny
 */

import { User, CreateUserInput, UpdateUserInput, UserActivity } from '../types';
import { ServiceConfig, PaginatedResponse, Pagination, shouldUsePostForFilter } from '@truths/shared';

// User DTO - Data Transfer Object matching API response format
interface UserDTO {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at?: string;
    updated_at?: string;
    is_active?: boolean;
    role?: string;
    base_role?: string;
    last_login?: string;
    // Detailed auth fields (from UserDetailResponse)
    is_verified?: boolean;
    must_change_password?: boolean;
    last_password_change?: string;
    failed_login_attempts?: number;
    locked_until?: string;
    tenant_id?: string;
}

// Transform user DTO to frontend User type
function transformUser(userDTO: UserDTO): User {
    // Helper function to parse dates safely
    const parseDate = (dateStr?: string): Date | undefined => {
        if (!dateStr) return undefined;
        try {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? undefined : date;
        } catch {
            return undefined;
        }
    };

    // Parse last_login - handle null, undefined, or empty string
    let lastLogin: Date | undefined = undefined;
    if (userDTO.last_login) {
        lastLogin = parseDate(userDTO.last_login);
    }

    // Get role - prioritize base_role over role
    const role = userDTO.base_role || userDTO.role || 'user';

    return {
        id: userDTO.id,
        email: userDTO.email,
        firstName: userDTO.first_name || '',
        lastName: userDTO.last_name || '',
        username: userDTO.username || userDTO.email.split('@')[0],
        status: userDTO.is_active !== false ? 'active' : 'inactive',
        role,
        baseRole: role,
        lastLogin,
        createdAt: userDTO.created_at ? new Date(userDTO.created_at) : new Date(),
        updatedAt: userDTO.updated_at ? new Date(userDTO.updated_at) : undefined,
        tenantId: userDTO.tenant_id,
        // Detailed auth fields
        isVerified: userDTO.is_verified,
        mustChangePassword: userDTO.must_change_password,
        lastPasswordChange: parseDate(userDTO.last_password_change),
        failedLoginAttempts: userDTO.failed_login_attempts,
        lockedUntil: parseDate(userDTO.locked_until),
    };
}

// Transform frontend user to backend request
function transformToBackend(user: CreateUserInput | UpdateUserInput): any {
    const result: any = {};

    if ('email' in user && user.email) result.email = user.email;
    if ('password' in user && user.password) result.password = user.password;
    if ('username' in user && user.username) result.username = user.username;
    if ('firstName' in user && user.firstName !== undefined) result.first_name = user.firstName;
    if ('lastName' in user && user.lastName !== undefined) result.last_name = user.lastName;
    if ('role' in user && user.role) result.role = user.role;
    if ('status' in user && user.status !== undefined) result.is_active = user.status === 'active';

    return result;
}

// User service specific endpoints
interface UserEndpoints extends Record<string, string> {
    users: string;
}

export type UserServiceConfig = ServiceConfig<UserEndpoints>;

export class UserService {
    private apiClient: UserServiceConfig['apiClient'];
    private endpoints: UserServiceConfig['endpoints'];

    constructor(config: UserServiceConfig) {
        this.apiClient = config.apiClient;
        this.endpoints = config.endpoints;
    }

    async fetchUsers(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        role?: string;
        status?: User['status'];
        createdAfter?: Date;
        createdBefore?: Date;
        // Support for complex filters
        userIds?: string[];
        tags?: string[];
        [key: string]: unknown;
    }): Promise<PaginatedResponse<User>> {
        try {
            // Build filter object from params (excluding pagination)
            const filter: Record<string, unknown> = {};

            if (params?.search) filter.search = params.search;
            if (params?.role) filter.role = params.role;
            if (params?.status !== undefined) {
                filter.is_active = params.status === 'active';
            }
            if (params?.createdAfter) filter.created_after = params.createdAfter.toISOString();
            if (params?.createdBefore) filter.created_before = params.createdBefore.toISOString();
            if (params?.userIds) filter.userIds = params.userIds;
            if (params?.tags) filter.tags = params.tags;

            // Check if we need POST for complex/large filters
            const usePost = shouldUsePostForFilter(filter);

            if (usePost) {
                // Use POST for complex filters
                const requestBody = {
                    filter,
                    pagination: {
                        skip: params?.skip ?? 0,
                        limit: params?.limit ?? 100,
                    },
                };

                const baseEndpoint = this.endpoints.users.replace(/\/$/, '');
                const response = await this.apiClient.post<{
                    items: UserDTO[];
                    total: number;
                    skip: number;
                    limit: number;
                    page: number;
                    total_pages: number;
                }>(
                    `${baseEndpoint}/search`,
                    requestBody,
                    { requiresAuth: true }
                );
                const pagination: Pagination = {
                    page: response.page,
                    pageSize: response.limit,
                    total: response.total,
                    totalPages: response.total_pages,
                };
                return {
                    data: (response.items || []).map(transformUser),
                    pagination,
                };
            } else {
                // Use GET for simple filters (backward compatible)
                const queryParams = new URLSearchParams();

                if (params?.skip !== undefined) {
                    queryParams.append('skip', params.skip.toString());
                }
                if (params?.limit !== undefined) {
                    queryParams.append('limit', params.limit.toString());
                }
                if (params?.search) {
                    queryParams.append('search', params.search);
                }
                if (params?.role) {
                    queryParams.append('role', params.role);
                }
                if (params?.status !== undefined) {
                    const isActive = params.status === 'active';
                    queryParams.append('is_active', isActive.toString());
                }
                if (params?.createdAfter) {
                    queryParams.append('created_after', params.createdAfter.toISOString());
                }
                if (params?.createdBefore) {
                    queryParams.append('created_before', params.createdBefore.toISOString());
                }

                const url = queryParams.toString()
                    ? `${this.endpoints.users}/?${queryParams.toString()}`
                    : this.endpoints.users;

                const response = await this.apiClient.get<{
                    items: UserDTO[];
                    total: number;
                    skip: number;
                    limit: number;
                    page: number;
                    total_pages: number;
                }>(
                    url,
                    { requiresAuth: true }
                );
                const pagination: Pagination = {
                    page: response.page,
                    pageSize: response.limit,
                    total: response.total,
                    totalPages: response.total_pages,
                };
                return {
                    data: (response.items || []).map(transformUser),
                    pagination,
                };
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    /**
     * Search users using the dedicated search endpoint (GET /users/search)
     * 
     * This method is designed for command palette and quick search use cases.
     * It uses the dedicated search endpoint to avoid conflicts with list filtering.
     * 
     * @param query - Search query string (required, min length 1)
     * @param limit - Maximum number of results to return (default: 100, max: 1000)
     * @returns Array of users matching the search query
     */
    async searchUsers(query: string, limit: number = 100): Promise<User[]> {
        try {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) {
                // Return empty array for empty queries instead of calling the API
                return [];
            }

            const queryParams = new URLSearchParams();
            queryParams.append('q', trimmedQuery);
            if (limit) {
                queryParams.append('limit', Math.min(limit, 1000).toString());
            }

            // Normalize endpoint URL: remove trailing slash before appending /search
            const baseEndpoint = this.endpoints.users.replace(/\/$/, '');
            const url = `${baseEndpoint}/search?${queryParams.toString()}`;

            const response = await this.apiClient.get<UserDTO[]>(
                url,
                { requiresAuth: true }
            );
            return response.map(transformUser);
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    }

    async fetchUser(id: string): Promise<User> {
        try {
            const baseEndpoint = this.endpoints.users.replace(/\/$/, '');
            const response = await this.apiClient.get<UserDTO>(
                `${baseEndpoint}/${id}`,
                { requiresAuth: true }
            );
            return transformUser(response);
        } catch (error) {
            console.error(`Error fetching user ${id}:`, error);
            throw error;
        }
    }

    async createUser(input: CreateUserInput): Promise<User> {
        try {
            const requestData = transformToBackend(input);
            const response = await this.apiClient.post<UserDTO>(
                this.endpoints.users,
                requestData,
                { requiresAuth: true }
            );
            return transformUser(response);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async updateUser(id: string, input: UpdateUserInput): Promise<User> {
        try {
            const requestData = transformToBackend(input);
            const baseEndpoint = this.endpoints.users.replace(/\/$/, '');
            const response = await this.apiClient.put<UserDTO>(
                `${baseEndpoint}/${id}`,
                requestData,
                { requiresAuth: true }
            );
            return transformUser(response);
        } catch (error) {
            console.error(`Error updating user ${id}:`, error);
            throw error;
        }
    }

    async deleteUser(id: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.users.replace(/\/$/, '');
            await this.apiClient.delete(
                `${baseEndpoint}/${id}`,
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error deleting user ${id}:`, error);
            throw error;
        }
    }

    async activateUser(id: string): Promise<User> {
        try {
            const baseEndpoint = this.endpoints.users.replace(/\/$/, '');
            const response = await this.apiClient.post<UserDTO>(
                `${baseEndpoint}/${id}/activate`,
                {},
                { requiresAuth: true }
            );
            return transformUser(response);
        } catch (error) {
            console.error(`Error activating user ${id}:`, error);
            throw error;
        }
    }

    async deactivateUser(id: string): Promise<User> {
        try {
            const baseEndpoint = this.endpoints.users.replace(/\/$/, '');
            const response = await this.apiClient.post<UserDTO>(
                `${baseEndpoint}/${id}/deactivate`,
                {},
                { requiresAuth: true }
            );
            return transformUser(response);
        } catch (error) {
            console.error(`Error deactivating user ${id}:`, error);
            throw error;
        }
    }

    async lockUser(id: string, lockoutMinutes: number = 60): Promise<User> {
        try {
            const baseEndpoint = this.endpoints.users.replace(/\/$/, '');
            const response = await this.apiClient.post<UserDTO>(
                `${baseEndpoint}/${id}/lock?lockout_minutes=${lockoutMinutes}`,
                {},
                { requiresAuth: true }
            );
            return transformUser(response);
        } catch (error) {
            console.error(`Error locking user ${id}:`, error);
            throw error;
        }
    }

    async unlockUser(id: string): Promise<User> {
        try {
            const baseEndpoint = this.endpoints.users.replace(/\/$/, '');
            const response = await this.apiClient.post<UserDTO>(
                `${baseEndpoint}/${id}/unlock`,
                {},
                { requiresAuth: true }
            );
            return transformUser(response);
        } catch (error) {
            console.error(`Error unlocking user ${id}:`, error);
            throw error;
        }
    }

    async resetPassword(id: string, newPassword: string): Promise<User> {
        try {
            const baseEndpoint = this.endpoints.users.replace(/\/$/, '');
            const response = await this.apiClient.post<UserDTO>(
                `${baseEndpoint}/${id}/reset-password`,
                { new_password: newPassword },
                { requiresAuth: true }
            );
            return transformUser(response);
        } catch (error) {
            console.error(`Error resetting password for user ${id}:`, error);
            throw error;
        }
    }

    /**
     * Fetch user activity logs from audit API
     * @param userId - User ID to fetch activity for
     * @param limit - Maximum number of events (default: 100)
     * @param hours - Last N hours of activity (optional)
     * 
     * This queries by entity_id where entity_type="user" to get all activities
     * related to the user (login, logout, account changes, etc.)
     */
    async fetchUserActivity(userId: string, limit: number = 100, hours?: number): Promise<UserActivity[]> {
        try {
            const queryParams = new URLSearchParams();
            // Query by entity_id to get all activities for this user (login, logout, etc.)
            queryParams.append('entity_id', userId);
            queryParams.append('entity_type', 'user');
            queryParams.append('limit', limit.toString());
            if (hours) {
                queryParams.append('hours', hours.toString());
            }

            const response = await this.apiClient.get<Array<{
                event_id: string;
                event_timestamp: string;
                event_type: string;
                severity: string;
                entity_type: string;
                entity_id: string;
                user_id: string | null;
                user_email: string | null;
                session_id: string | null;
                request_id: string | null;
                ip_address: string | null;
                user_agent: string | null;
                description: string;
                metadata: Record<string, any>;
            }>>(
                `/api/v1/audit/user-activity?${queryParams.toString()}`,
                { requiresAuth: true }
            );

            // Transform API response to UserActivity format
            return response.map((event) => {
                // Parse event_timestamp - API returns as ISO string
                let timestamp: Date;
                try {
                    // Debug: log the raw event_timestamp value
                    if (typeof event.event_timestamp !== 'string' && event.event_timestamp) {
                        console.warn('Unexpected event_timestamp type:', typeof event.event_timestamp, event.event_timestamp);
                    }

                    const timestampStr = typeof event.event_timestamp === 'string'
                        ? event.event_timestamp
                        : (event.event_timestamp as string)?.toString() || '';

                    timestamp = new Date(timestampStr);

                    // Validate the date is valid
                    if (isNaN(timestamp.getTime())) {
                        console.warn('Invalid event_timestamp from API:', event.event_timestamp, 'parsed as:', timestampStr);
                        timestamp = new Date();
                    }
                } catch (error) {
                    console.warn('Error parsing event_timestamp:', event.event_timestamp, error);
                    timestamp = new Date();
                }

                return {
                    id: event.event_id,
                    userId: event.user_id || userId,
                    action: this.formatEventType(event.event_type),
                    resource: event.entity_type,
                    resourceId: event.entity_id,
                    details: event.description,
                    ipAddress: event.ip_address || undefined,
                    userAgent: event.user_agent || undefined,
                    timestamp,
                    eventType: event.event_type,
                    severity: event.severity,
                };
            });
        } catch (error) {
            console.error(`Error fetching user activity for ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Format event type to human-readable action
     */
    private formatEventType(eventType: string): string {
        const typeMap: Record<string, string> = {
            login: 'Logged in',
            logout: 'Logged out',
            password_change: 'Changed password',
            account_lock: 'Account locked',
            account_unlock: 'Account unlocked',
            account_activate: 'Account activated',
            account_deactivate: 'Account deactivated',
            create: 'Created',
            update: 'Updated',
            delete: 'Deleted',
            read: 'Viewed',
        };
        return typeMap[eventType] || eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}

// Default export
export default UserService;
