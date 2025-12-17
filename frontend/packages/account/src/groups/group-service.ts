/**
 * Group Service
 * 
 * Encapsulates all group-related API operations
 * Handles data transformation between backend and frontend types
 *
 * @author Phanny
 */

import { Role, Group } from '../types';
import { ServiceConfig } from '@truths/shared';

// Group DTO - Data Transfer Object matching API response format
interface GroupDTO {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    members_count?: number;
    roles_count?: number;
}

// Transform group DTO to frontend Group type
function transformGroup(groupDTO: GroupDTO): Group {
    return {
        id: groupDTO.id,
        tenantId: groupDTO.tenant_id,
        name: groupDTO.name,
        description: groupDTO.description,
        isActive: groupDTO.is_active,
        createdAt: new Date(groupDTO.created_at),
        updatedAt: new Date(groupDTO.updated_at),
        memberCount: groupDTO.members_count,
        roleCount: groupDTO.roles_count,
    };
}

// Transform frontend group to backend request
function transformToBackend(data: {
    name?: string;
    description?: string;
    is_active?: boolean;
}): any {
    const result: any = {};
    
    if (data.name !== undefined) result.name = data.name;
    if (data.description !== undefined) result.description = data.description;
    if (data.is_active !== undefined) result.is_active = data.is_active;
    
    return result;
}

// Group service specific endpoints
interface GroupEndpoints extends Record<string, string> {
    groups: string;
}

export type GroupServiceConfig = ServiceConfig<GroupEndpoints>;

export class GroupService {
    private apiClient: GroupServiceConfig['apiClient'];
    private endpoints: GroupServiceConfig['endpoints'];

    constructor(config: GroupServiceConfig) {
        this.apiClient = config.apiClient;
        this.endpoints = config.endpoints;
    }

    /**
     * Fetch all groups for the current tenant
     */
    async fetchGroups(includeInactive: boolean = false): Promise<Group[]> {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('include_inactive', includeInactive.toString());
            
            const response = await this.apiClient.get<{
                groups: GroupDTO[];
                total: number;
            }>(
                `${this.endpoints.groups}?${queryParams.toString()}`,
                { requiresAuth: true }
            );
            
            return (response.groups || []).map(transformGroup);
        } catch (error) {
            console.error('Error fetching groups:', error);
            throw error;
        }
    }

    /**
     * Fetch a single group by ID
     */
    async fetchGroup(groupId: string): Promise<Group> {
        try {
            const baseEndpoint = this.endpoints.groups.replace(/\/$/, '');
            const response = await this.apiClient.get<GroupDTO>(
                `${baseEndpoint}/${groupId}`,
                { requiresAuth: true }
            );
            return transformGroup(response);
        } catch (error) {
            console.error(`Error fetching group ${groupId}:`, error);
            throw error;
        }
    }

    /**
     * Create a new group
     */
    async createGroup(data: {
        name: string;
        description?: string;
    }): Promise<Group> {
        try {
            const requestData = transformToBackend(data);
            const response = await this.apiClient.post<GroupDTO>(
                this.endpoints.groups,
                requestData,
                { requiresAuth: true }
            );
            return transformGroup(response);
        } catch (error) {
            console.error('Error creating group:', error);
            throw error;
        }
    }

    /**
     * Update a group
     */
    async updateGroup(groupId: string, data: {
        name?: string;
        description?: string;
        is_active?: boolean;
    }): Promise<Group> {
        try {
            const requestData = transformToBackend({ ...data, is_active: data.is_active });
            const baseEndpoint = this.endpoints.groups.replace(/\/$/, '');
            const response = await this.apiClient.patch<GroupDTO>(
                `${baseEndpoint}/${groupId}`,
                requestData,
                { requiresAuth: true }
            );
            return transformGroup(response);
        } catch (error) {
            console.error(`Error updating group ${groupId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a group
     */
    async deleteGroup(groupId: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.groups.replace(/\/$/, '');
            await this.apiClient.delete(
                `${baseEndpoint}/${groupId}`,
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error deleting group ${groupId}:`, error);
            throw error;
        }
    }

    /**
     * Add a user to a group (Method 2 - user inherits all group roles)
     */
    async addUserToGroup(userId: string, groupId: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.groups.replace(/\/$/, '');
            await this.apiClient.post(
                `${baseEndpoint}/${groupId}/users`,
                {
                    user_id: userId,
                },
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error adding user ${userId} to group ${groupId}:`, error);
            throw error;
        }
    }

    /**
     * Remove a user from a group
     */
    async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.groups.replace(/\/$/, '');
            await this.apiClient.delete(
                `${baseEndpoint}/${groupId}/users/${userId}`,
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error removing user ${userId} from group ${groupId}:`, error);
            throw error;
        }
    }

    /**
     * Get all user IDs in a group
     */
    async getGroupMembers(groupId: string): Promise<string[]> {
        try {
            const baseEndpoint = this.endpoints.groups.replace(/\/$/, '');
            const response = await this.apiClient.get<string[]>(
                `${baseEndpoint}/${groupId}/users`,
                { requiresAuth: true }
            );
            return response || [];
        } catch (error) {
            console.error(`Error fetching members for group ${groupId}:`, error);
            throw error;
        }
    }

    /**
     * Add a role to a group
     */
    async addRoleToGroup(groupId: string, roleId: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.groups.replace(/\/$/, '');
            await this.apiClient.post(
                `${baseEndpoint}/${groupId}/roles`,
                {
                    role_id: roleId,
                },
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error adding role ${roleId} to group ${groupId}:`, error);
            throw error;
        }
    }

    /**
     * Remove a role from a group
     */
    async removeRoleFromGroup(groupId: string, roleId: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.groups.replace(/\/$/, '');
            await this.apiClient.delete(
                `${baseEndpoint}/${groupId}/roles/${roleId}`,
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error removing role ${roleId} from group ${groupId}:`, error);
            throw error;
        }
    }

    /**
     * Get all roles in a group
     */
    async getGroupRoles(groupId: string): Promise<Role[]> {
        try {
            const baseEndpoint = this.endpoints.groups.replace(/\/$/, '');
            const response = await this.apiClient.get<Array<{
                id: string;
                tenant_id: string;
                name: string;
                description?: string;
                permissions: string[];
                is_system_role: boolean;
                created_at: string;
                updated_at: string;
            }>>(
                `${baseEndpoint}/${groupId}/roles`,
                { requiresAuth: true }
            );
            
            // Transform roles
            return (response || []).map(roleDTO => ({
                id: roleDTO.id,
                name: roleDTO.name,
                description: roleDTO.description,
                permissions: roleDTO.permissions.map(name => ({
                    id: name,
                    name,
                    resource: name.split(':')[0] || name,
                    action: (name.split(':')[1] || 'read') as Role['permissions'][0]['action'],
                })),
                isSystem: roleDTO.is_system_role,
                createdAt: new Date(roleDTO.created_at),
                updatedAt: new Date(roleDTO.updated_at),
            }));
        } catch (error) {
            console.error(`Error fetching roles for group ${groupId}:`, error);
            throw error;
        }
    }

    /**
     * Get all groups a user belongs to
     */
    async getUserGroups(userId: string): Promise<Group[]> {
        try {
            const response = await this.apiClient.get<{
                groups: GroupDTO[];
                total: number;
            }>(
                `/api/v1/users/${userId}/groups`,
                { requiresAuth: true }
            );
            
            return (response.groups || []).map(transformGroup);
        } catch (error) {
            console.error(`Error fetching groups for user ${userId}:`, error);
            throw error;
        }
    }
}

// Default export
export default GroupService;

