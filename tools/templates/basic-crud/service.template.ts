/**
 * {{EntityName}} Service
 * 
 * Encapsulates all {{entity-name}}-related API operations
 * Handles data transformation between backend and frontend types
 */

import type { {{EntityName}}, Create{{EntityName}}Input, Update{{EntityName}}Input } from './types';
import { ServiceConfig, PaginatedResponse, Pagination } from '@truths/shared';

// {{EntityName}} DTO - Data Transfer Object matching API response format
interface {{EntityName}}DTO {
    id: string;
    tenant_id: string;
    {{#fields}}
    {{#unless isSystemField}}
    {{name}}{{#if optional}}?{{/if}}: {{type}};
    {{/unless}}
    {{/fields}}
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deactivated_at?: string | null;
}

// Transform {{entity-name}} DTO to frontend {{EntityName}} type
function transform{{EntityName}}(dto: {{EntityName}}DTO): {{EntityName}} {
    return {
        id: dto.id,
        {{#fields}}
        {{#unless isSystemField}}
        {{name}}: dto.{{name}},
        {{/unless}}
        {{/fields}}
        created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
        updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
    };
}

// {{EntityName}} service specific endpoints
interface {{EntityName}}Endpoints extends Record<string, string> {
    {{entityPlural}}: string;
}

export type {{EntityName}}ServiceConfig = ServiceConfig<{{EntityName}}Endpoints>;

export class {{EntityName}}Service {
    private apiClient: {{EntityName}}ServiceConfig['apiClient'];
    private endpoints: {{EntityName}}ServiceConfig['endpoints'];

    constructor(config: {{EntityName}}ServiceConfig) {
        this.apiClient = config.apiClient;
        this.endpoints = config.endpoints;
    }

    async fetch{{EntityPlural}}(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        is_active?: boolean;
    }): Promise<PaginatedResponse<{{EntityName}}>> {
        try {
            const queryParams = new URLSearchParams();

            if (params?.skip !== undefined) {
                queryParams.append('skip', params.skip.toString());
            }
            if (params?.limit !== undefined) {
                queryParams.append('limit', params.limit.toString());
            }
            if (params?.search !== undefined && params.search.trim()) {
                queryParams.append('search', params.search.trim());
            }
            if (params?.is_active !== undefined) {
                queryParams.append('is_active', params.is_active.toString());
            }

            const baseEndpoint = this.endpoints.{{entityPlural}}.replace(/\/$/, '');
            const url = queryParams.toString()
                ? `${baseEndpoint}?${queryParams.toString()}`
                : baseEndpoint;

            const response = await this.apiClient.get<{
                items: {{EntityName}}DTO[];
                total: number;
                skip: number;
                limit: number;
                has_next: boolean;
            }>(
                url,
                { requiresAuth: true }
            );

            const skip = response.skip || params?.skip || 0;
            const limit = response.limit || params?.limit || 50;
            const total = response.total || 0;

            const pagination: Pagination = {
                page: Math.floor(skip / limit) + 1,
                pageSize: limit,
                total: total,
                totalPages: Math.ceil(total / limit),
            };

            return {
                data: (response.items || []).map(transform{{EntityName}}),
                pagination,
            };
        } catch (error) {
            console.error('Error fetching {{EntityName}}:', error);
            throw error;
        }
    }

    async search{{EntityPlural}}(query: string, limit: number = 100): Promise<{{EntityName}}[]> {
        try {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) {
                return [];
            }

            const queryParams = new URLSearchParams();
            queryParams.append('search', trimmedQuery);
            queryParams.append('limit', Math.min(limit, 200).toString());

            const baseEndpoint = this.endpoints.{{entityPlural}}.replace(/\/$/, '');
            const url = `${baseEndpoint}?${queryParams.toString()}`;

            const response = await this.apiClient.get<{
                items: {{EntityName}}DTO[];
                skip: number;
                limit: number;
                total: number;
                has_next: boolean;
            }>(
                url,
                { requiresAuth: true }
            );

            return (response.items || []).map(transform{{EntityName}});
        } catch (error) {
            console.error('Error searching {{EntityName}}:', error);
            throw error;
        }
    }

    async fetch{{EntityName}}ById(id: string): Promise<{{EntityName}}> {
        try {
            const baseEndpoint = this.endpoints.{{entityPlural}}.replace(/\/$/, '');
            const response = await this.apiClient.get<{{EntityName}}DTO>(
                `${baseEndpoint}/${id}`,
                { requiresAuth: true }
            );
            return transform{{EntityName}}(response);
        } catch (error) {
            console.error(`Error fetching {{EntityName}} ${id}:`, error);
            throw error;
        }
    }

    async create{{EntityName}}(input: Create{{EntityName}}Input): Promise<{{EntityName}}> {
        try {
            const response = await this.apiClient.post<{{EntityName}}DTO>(
                this.endpoints.{{entityPlural}},
                input,
                { requiresAuth: true }
            );
            return transform{{EntityName}}(response);
        } catch (error) {
            console.error('Error creating {{EntityName}}:', error);
            throw error;
        }
    }

    async update{{EntityName}}(id: string, input: Update{{EntityName}}Input): Promise<{{EntityName}}> {
        try {
            const baseEndpoint = this.endpoints.{{entityPlural}}.replace(/\/$/, '');
            const response = await this.apiClient.put<{{EntityName}}DTO>(
                `${baseEndpoint}/${id}`,
                input,
                { requiresAuth: true }
            );
            return transform{{EntityName}}(response);
        } catch (error) {
            console.error(`Error updating {{EntityName}} ${id}:`, error);
            throw error;
        }
    }

    async delete{{EntityName}}(id: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.{{entityPlural}}.replace(/\/$/, '');
            await this.apiClient.delete(
                `${baseEndpoint}/${id}`,
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error deleting {{EntityName}} ${id}:`, error);
            throw error;
        }
    }
}
