/**
 * Role Service
 * 
 * Encapsulates all role-related API operations
 * Handles data transformation between backend and frontend types
 *
 * @author Phanny
 */

import { Role, Permission } from '../types';
import { ServiceConfig } from '@truths/shared';

// Role DTO - Data Transfer Object matching API response format
interface RoleDTO {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    permissions: string[];  // Array of permission strings from backend
    is_system_role: boolean;
    created_at: string;
    updated_at: string;
}

// Transform role DTO to frontend Role type
function transformRole(roleDTO: RoleDTO): Role {
    return {
        id: roleDTO.id,
        name: roleDTO.name,
        description: roleDTO.description,
        permissions: roleDTO.permissions.map(name => ({
            id: name,  // Use name as ID for permissions
            name,
            resource: name.split(':')[0] || name,
            action: (name.split(':')[1] || 'read') as Permission['action'],
        })),
        isSystem: roleDTO.is_system_role,
        createdAt: new Date(roleDTO.created_at),
        updatedAt: new Date(roleDTO.updated_at),
    };
}

// Transform frontend role to backend request
function transformToBackend(data: {
    name?: string;
    description?: string;
    permissions?: string[];
}): any {
    const result: any = {};
    
    if (data.name !== undefined) result.name = data.name;
    if (data.description !== undefined) result.description = data.description;
    if (data.permissions !== undefined) result.permissions = data.permissions;
    
    return result;
}

// Role service specific endpoints
interface RoleEndpoints extends Record<string, string> {
    roles: string;
}

export type RoleServiceConfig = ServiceConfig<RoleEndpoints>;

export class RoleService {
    private apiClient: RoleServiceConfig['apiClient'];
    private endpoints: RoleServiceConfig['endpoints'];

    constructor(config: RoleServiceConfig) {
        this.apiClient = config.apiClient;
        this.endpoints = config.endpoints;
    }

    /**
     * Fetch all roles for the current tenant
     */
    async fetchRoles(includeSystemRoles: boolean = true): Promise<Role[]> {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('include_system_roles', includeSystemRoles.toString());
            
            const response = await this.apiClient.get<{
                roles: RoleDTO[];
                total: number;
            }>(
                `${this.endpoints.roles}?${queryParams.toString()}`,
                { requiresAuth: true }
            );
            
            return (response.roles || []).map(transformRole);
        } catch (error) {
            console.error('Error fetching roles:', error);
            throw error;
        }
    }

    /**
     * Fetch a single role by ID
     */
    async fetchRole(roleId: string): Promise<Role> {
        try {
            const baseEndpoint = this.endpoints.roles.replace(/\/$/, '');
            const response = await this.apiClient.get<RoleDTO>(
                `${baseEndpoint}/${roleId}`,
                { requiresAuth: true }
            );
            return transformRole(response);
        } catch (error) {
            console.error(`Error fetching role ${roleId}:`, error);
            throw error;
        }
    }

    /**
     * Create a new custom role
     */
    async createRole(data: {
        name: string;
        description?: string;
        permissions: string[];
    }): Promise<Role> {
        try {
            const requestData = transformToBackend(data);
            const response = await this.apiClient.post<RoleDTO>(
                this.endpoints.roles,
                requestData,
                { requiresAuth: true }
            );
            return transformRole(response);
        } catch (error) {
            console.error('Error creating role:', error);
            throw error;
        }
    }

    /**
     * Update a custom role
     */
    async updateRole(roleId: string, data: {
        name?: string;
        description?: string;
        permissions?: string[];
    }): Promise<Role> {
        try {
            const requestData = transformToBackend(data);
            const baseEndpoint = this.endpoints.roles.replace(/\/$/, '');
            const response = await this.apiClient.patch<RoleDTO>(
                `${baseEndpoint}/${roleId}`,
                requestData,
                { requiresAuth: true }
            );
            return transformRole(response);
        } catch (error) {
            console.error(`Error updating role ${roleId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a custom role
     */
    async deleteRole(roleId: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.roles.replace(/\/$/, '');
            await this.apiClient.delete(
                `${baseEndpoint}/${roleId}`,
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error deleting role ${roleId}:`, error);
            throw error;
        }
    }

    /**
     * Assign a role directly to a user (Method 1)
     */
    async assignRoleToUser(userId: string, roleId: string): Promise<void> {
        try {
            await this.apiClient.post(
                `${this.endpoints.roles}/assign`,
                {
                    user_id: userId,
                    role_id: roleId,
                },
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error assigning role ${roleId} to user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Remove a role from a user
     */
    async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.roles.replace(/\/$/, '');
            await this.apiClient.delete(
                `${baseEndpoint}/assign/${userId}/${roleId}`,
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error removing role ${roleId} from user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get roles directly assigned to a user (Method 1 only)
     */
    async getUserDirectRoles(userId: string): Promise<Role[]> {
        try {
            const baseEndpoint = this.endpoints.roles.replace(/\/$/, '');
            const response = await this.apiClient.get<{
                roles: RoleDTO[];
                total: number;
            }>(
                `${baseEndpoint}/users/${userId}/direct`,
                { requiresAuth: true }
            );
            return (response.roles || []).map(transformRole);
        } catch (error) {
            console.error(`Error fetching direct roles for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get all roles for a user (direct roles + roles from groups)
     */
    async getUserAllRoles(userId: string): Promise<Role[]> {
        try {
            const response = await this.apiClient.get<{
                roles: RoleDTO[];
                total: number;
            }>(
                `/api/v1/users/${userId}/roles/all`,
                { requiresAuth: true }
            );
            return (response.roles || []).map(transformRole);
        } catch (error) {
            console.error(`Error fetching all roles for user ${userId}:`, error);
            throw error;
        }
    }
}

// Default export
export default RoleService;

