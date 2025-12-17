/**
 * CustomerGroup Service
 * 
 * Encapsulates all customer-group-related API operations
 * Handles data transformation between backend and frontend types
 *
 * @author Phanny
 */

import {
    CustomerGroup,
    CustomerGroupTree,
    CustomerGroupHierarchy,
    CreateCustomerGroupInput,
    UpdateCustomerGroupInput,
    CustomerGroupListParams,
} from './types';
import { ServiceConfig, PaginatedResponse } from '@truths/shared';

// DTO definition matching API response
interface CustomerGroupDTO {
    id: string;
    tenant_id: string;
    code: string;
    name: string;
    description?: string;
    parent_id: string | null;
    level: number;
    sort_order: number;
    is_active: boolean;

    attributes?: Record<string, any>;
    created_at: string;
    updated_at?: string;
}

// Transform DTO to frontend type
function transformCustomerGroup(dto: CustomerGroupDTO): CustomerGroup {
    return {
        ...dto,
        created_at: new Date(dto.created_at),
        updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
    };
}

export interface CustomerGroupEndpoints extends Record<string, string> {
    customerGroups: string;
}

export type CustomerGroupServiceConfig = ServiceConfig<CustomerGroupEndpoints>;

export class CustomerGroupService {
    private config: CustomerGroupServiceConfig;

    constructor(config: CustomerGroupServiceConfig) {
        this.config = config;
    }

    /**
     * Fetch paginated list of customerGroups
     */
    async fetchCustomerGroups(params?: CustomerGroupListParams): Promise<PaginatedResponse<CustomerGroup>> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.customerGroups || '/api/v1/sales/customer-groups';

        const queryParams = new URLSearchParams();
        if (params?.parent_id) queryParams.append('parent_id', params.parent_id);
        if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
        if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
        if (params?.search !== undefined && params.search.trim()) {
            queryParams.append('search', params.search.trim());
        }
        if (params?.is_active !== undefined) {
            queryParams.append('is_active', params.is_active.toString());
        }

        const baseEndpoint = endpoint.replace(/\/$/, '');
        const url = queryParams.toString()
            ? `${baseEndpoint}?${queryParams.toString()}`
            : baseEndpoint;

        const data = await apiClient.get<{
            items: CustomerGroupDTO[];
            total: number;
            skip: number;
            limit: number;
            has_next: boolean;
        }>(url, { requiresAuth: true });

        const skip = data.skip || params?.skip || 0;
        const limit = data.limit || params?.limit || 50;
        const total = data.total || 0;

        return {
            data: (data.items || []).map(transformCustomerGroup),
            pagination: {
                page: Math.floor(skip / limit) + 1,
                pageSize: limit,
                total: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Fetch customer-group tree (all root customerGroups with full hierarchy)
     */
    async fetchCustomerGroupTree(): Promise<CustomerGroupTree[]> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.customerGroups || '/api/v1/sales/customer-groups';

        const url = `${endpoint}/tree/root`;
        const data = await apiClient.get<any>(url, { requiresAuth: true });

        // Ensure we return an array
        if (!data) {
            return [];
        }
        if (!Array.isArray(data)) {
            return [];
        }

        // Transform the tree structure
        const transformTree = (dto: any): CustomerGroupTree => {
            const item = transformCustomerGroup(dto);
            const children = (dto.children || []).map(transformTree);
            return {
                ...item,
                children,
                children_count: dto.children_count || children.length,
                has_children: children.length > 0 || dto.has_children || false,
            };
        };

        return data.map(transformTree);
    }

    /**
     * Fetch a single customer-group by ID
     */
    async fetchCustomerGroup(id: string): Promise<CustomerGroup> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.customerGroups || '/api/v1/sales/customer-groups';
        const data = await apiClient.get<CustomerGroupDTO>(`${endpoint}/${id}`, { requiresAuth: true });
        return transformCustomerGroup(data);
    }

    /**
     * Fetch customer-group hierarchy (with ancestors and descendants)
     */
    async fetchCustomerGroupHierarchy(id: string): Promise<CustomerGroupHierarchy> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.customerGroups || '/api/v1/sales/customer-groups';
        const data = await apiClient.get<any>(`${endpoint}/${id}/hierarchy`, { requiresAuth: true });

        return {
            item: transformCustomerGroup(data.item || data.category || data.group), // Fallback for different naming conventions
            ancestors: (data.ancestors || []).map(transformCustomerGroup),
            descendants: (data.descendants || []).map(transformCustomerGroup),
        };
    }

    /**
     * Fetch direct children of a customer-group
     */
    async fetchCustomerGroupChildren(id: string): Promise<CustomerGroup[]> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.customerGroups || '/api/v1/sales/customer-groups';
        const data = await apiClient.get<CustomerGroupDTO[]>(`${endpoint}/${id}/children`, { requiresAuth: true });
        return (data || []).map(transformCustomerGroup);
    }

    /**
     * Create a new customer-group
     */
    async createCustomerGroup(input: CreateCustomerGroupInput): Promise<CustomerGroup> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.customerGroups || '/api/v1/sales/customer-groups';
        // Transform frontend input to backend API format
        const apiPayload: any = {
            code: input.code,
            name: input.name,
            parent_id: input.parent_id ? input.parent_id : null,
            sort_order: input.sort_order,
        };
        const data = await apiClient.post<CustomerGroupDTO>(endpoint, apiPayload, { requiresAuth: true });
        return transformCustomerGroup(data);
    }

    /**
     * Update an existing customer-group
     */
    async updateCustomerGroup(id: string, input: UpdateCustomerGroupInput): Promise<CustomerGroup> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.customerGroups || '/api/v1/sales/customer-groups';
        // Transform frontend input to backend API format
        const apiPayload: any = {};
        if (input.code !== undefined) apiPayload.code = input.code;
        if (input.name !== undefined) apiPayload.name = input.name;
        if (input.parent_id !== undefined) apiPayload.parent_id = input.parent_id || null;
        if (input.sort_order !== undefined) apiPayload.sort_order = input.sort_order;
        const data = await apiClient.put<CustomerGroupDTO>(`${endpoint}/${id}`, apiPayload, { requiresAuth: true });
        return transformCustomerGroup(data);
    }

    /**
     * Delete a customer-group
     */
    async deleteCustomerGroup(id: string): Promise<void> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.customerGroups || '/api/v1/sales/customer-groups';
        await apiClient.delete(`${endpoint}/${id}`, { requiresAuth: true });
    }
}
