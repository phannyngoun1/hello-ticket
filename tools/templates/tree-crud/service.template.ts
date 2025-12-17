/**
 * {{EntityName}} Service
 * 
 * Encapsulates all {{entity-name}}-related API operations
 * Handles data transformation between backend and frontend types
 */

import {
    {{EntityName}},
    {{EntityName}}Tree,
    {{EntityName}}Hierarchy,
    Create{{EntityName}}Input,
    Update{{EntityName}}Input,
    {{EntityName}}ListParams,
} from './types';
import { ServiceConfig, PaginatedResponse } from '@truths/shared';

// DTO definition matching API response
interface {{EntityName}}DTO {
    id: string;
    tenant_id: string;
    code: string;
    name: string;
    description?: string;
    parent_{{entityNameSnake}}_id: string | null;  // Backend uses parent_{{entityNameSnake}}_id
    level: number;
    sort_order: number;
    is_active: boolean;
    {{#fields}}
    {{#unless isSystemField}}
    {{name}}: {{type}}{{#if required}}{{else}} | null{{/if}};
    {{/unless}}
    {{/fields}}
    attributes?: Record<string, any>;
    created_at: string;
    updated_at?: string;
}

// Transform DTO to frontend type
function transform{{EntityName}}(dto: {{EntityName}}DTO): {{EntityName}} {
    return {
        ...dto,
        parent_id: dto.parent_{{entityNameSnake}}_id,  // Map parent_{{entityNameSnake}}_id to parent_id for frontend
        created_at: new Date(dto.created_at),
        updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
    };
}

export interface {{EntityName}}Endpoints extends Record<string, string> {
    {{entityPlural}}:string;
}

export type {{EntityName}}ServiceConfig = ServiceConfig<{{EntityName}}Endpoints>;

export class {{EntityName}}Service {
    private config: {{EntityName}}ServiceConfig;

    constructor(config: {{EntityName}}ServiceConfig) {
        this.config = config;
    }

    /**
     * Fetch paginated list of {{entityPlural}}
     */
    async fetch{{EntityPlural}}(params?: {{EntityName}}ListParams): Promise<PaginatedResponse<{{EntityName}}>> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.{{entityPlural}} || '{{endpoint}}';

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
            items: {{EntityName}}DTO[];
            total: number;
            skip: number;
            limit: number;
            has_next: boolean;
        }>(url, { requiresAuth: true });

        const skip = data.skip || params?.skip || 0;
        const limit = data.limit || params?.limit || 50;
        const total = data.total || 0;

        return {
            data: (data.items || []).map(transform{{EntityName}}),
            pagination: {
                page: Math.floor(skip / limit) + 1,
                pageSize: limit,
                total: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Fetch {{entity-name}} tree (all root {{entityPlural}} with full hierarchy)
     */
    async fetch{{EntityName}}Tree(search?: string): Promise<{{EntityName}}Tree[]> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.{{entityPlural}} || '{{endpoint}}';

        const queryParams = new URLSearchParams();
        if (search?.trim()) {
            queryParams.append('search', search.trim());
        }

        const baseUrl = `${endpoint}/tree/root`;
        const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
        const data = await apiClient.get<any>(url, { requiresAuth: true });

        // Ensure we return an array
        if (!data) {
            return [];
        }
        if (!Array.isArray(data)) {
            return [];
        }

        // Transform the tree structure
        const transformTree = (dto: any): {{EntityName}}Tree => {
            const item = transform{{EntityName}}(dto);
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
     * Fetch a single {{entity-name}} by ID
     */
    async fetch{{EntityName}}(id: string): Promise<{{EntityName}}> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.{{entityPlural}} || '{{endpoint}}';
        const data = await apiClient.get<{{EntityName}}DTO>(`${endpoint}/${id}`, { requiresAuth: true });
        return transform{{EntityName}}(data);
    }

    /**
     * Fetch {{entity-name}} hierarchy (with ancestors and descendants)
     */
    async fetch{{EntityName}}Hierarchy(id: string): Promise<{{EntityName}}Hierarchy> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.{{entityPlural}} || '{{endpoint}}';
        const data = await apiClient.get<any>(`${endpoint}/${id}/hierarchy`, { requiresAuth: true });

        return {
            item: transform{{EntityName}}(data.item || data.category || data.group), // Fallback for different naming conventions
            ancestors: (data.ancestors || []).map(transform{{EntityName}}),
            descendants: (data.descendants || []).map(transform{{EntityName}}),
        };
    }

    /**
     * Fetch direct children of a {{entity-name}}
     */
    async fetch{{EntityName}}Children(id: string): Promise<{{EntityName}}[]> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.{{entityPlural}} || '{{endpoint}}';
        const data = await apiClient.get<{{EntityName}}DTO[]>(`${endpoint}/${id}/children`, { requiresAuth: true });
        return (data || []).map(transform{{EntityName}});
    }

    /**
     * Create a new {{entity-name}}
     */
    async create{{EntityName}}(input: Create{{EntityName}}Input): Promise<{{EntityName}}> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.{{entityPlural}} || '{{endpoint}}';
        // Transform parent_id to parent_{{entityNameSnake}}_id for backend API
        const { parent_id, ...rest } = input;
        const requestBody: any = {
            ...rest,
        };
        // Only include parent_{{entityNameSnake}}_id if parent_id is provided
        if (parent_id !== undefined && parent_id !== null && parent_id !== '') {
            requestBody.parent_{{entityNameSnake}}_id = parent_id;
        }
        const data = await apiClient.post<{{EntityName}}DTO>(endpoint, requestBody, { requiresAuth: true });
        return transform{{EntityName}}(data);
    }

    /**
     * Update an existing {{entity-name}}
     */
    async update{{EntityName}}(id: string, input: Update{{EntityName}}Input): Promise<{{EntityName}}> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.{{entityPlural}} || '{{endpoint}}';
        // Transform parent_id to parent_{{entityNameSnake}}_id for backend API
        const { parent_id, ...rest } = input;
        const requestBody: any = {
            ...rest,
        };
        // Only include parent_{{entityNameSnake}}_id if parent_id is provided
        if (parent_id !== undefined && parent_id !== null && parent_id !== '') {
            requestBody.parent_{{entityNameSnake}}_id = parent_id;
        } else if (parent_id === null || parent_id === '') {
            // Explicitly set to null if empty string or null is provided (to clear parent)
            requestBody.parent_{{entityNameSnake}}_id = null;
        }
        const data = await apiClient.put<{{EntityName}}DTO>(`${endpoint}/${id}`, requestBody, { requiresAuth: true });
        return transform{{EntityName}}(data);
    }

    /**
     * Delete a {{entity-name}}
     */
    async delete{{EntityName}}(id: string): Promise<void> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.{{entityPlural}} || '{{endpoint}}';
        await apiClient.delete(`${endpoint}/${id}`, { requiresAuth: true });
    }
}
