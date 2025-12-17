/**
 * CustomerType Service
 *
 * Encapsulates all customer-type-related API operations
 * Handles data transformation between backend and frontend types
 *
 * @author Phanny
 */

import type {CustomerType, CreateCustomerTypeInput, UpdateCustomerTypeInput } from './types';
import { ServiceConfig, PaginatedResponse, Pagination } from '@truths/shared';

// CustomerType DTO - Data Transfer Object matching API response format
interface CustomerTypeDTO {
    id: string;
    tenant_id: string;

    code: string;

    name: string;

    is_active: boolean;
    created_at: string;
    updated_at: string;
    deactivated_at?: string | null;
}

// Transform customer-type DTO to frontend CustomerType type
function transformCustomerType(dto: CustomerTypeDTO): CustomerType {
    return {
        id: dto.id,

        code: dto.code,

        name: dto.name,

        created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
        updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
    };
}

// CustomerType service specific endpoints
interface CustomerTypeEndpoints extends Record<string, string> {customerTypes: string;
}

export type CustomerTypeServiceConfig = ServiceConfig<CustomerTypeEndpoints>;

export class CustomerTypeService {
    private apiClient: CustomerTypeServiceConfig['apiClient'];
    private endpoints: CustomerTypeServiceConfig['endpoints'];

    constructor(config: CustomerTypeServiceConfig) {
        this.apiClient = config.apiClient;
        this.endpoints = config.endpoints;
    }

    async fetchCustomerTypes(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        is_active?: boolean;
    }): Promise<PaginatedResponse<CustomerType>> {
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

            const baseEndpoint = this.endpoints.customerTypes.replace(/\/$/, '');
            const url = queryParams.toString()
                ? `${baseEndpoint}?${queryParams.toString()}`
                : baseEndpoint;

            const response = await this.apiClient.get<{
                items: CustomerTypeDTO[];
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
                data: (response.items || []).map(transformCustomerType),
                pagination,
            };
        } catch (error) {
            console.error('Error fetching CustomerType:', error);
            throw error;
        }}

    async searchCustomerTypes(query: string, limit: number = 100): Promise<CustomerType[]> {
        try {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) {
                return [];
            }

            const queryParams = new URLSearchParams();
            queryParams.append('search', trimmedQuery);
            queryParams.append('limit', Math.min(limit, 200).toString());

            const baseEndpoint = this.endpoints.customerTypes.replace(/\/$/, '');
            const url = `${baseEndpoint}?${queryParams.toString()}`;

            const response = await this.apiClient.get<{
                items: CustomerTypeDTO[];
                skip: number;
                limit: number;
                total: number;
                has_next: boolean;
            }>(
                url,
                { requiresAuth: true }
            );

            return (response.items || []).map(transformCustomerType);
        } catch (error) {
            console.error('Error searching CustomerType:', error);
            throw error;
        }}

    async fetchCustomerTypeById(id: string): Promise<CustomerType> {
        try {
            const baseEndpoint = this.endpoints.customerTypes.replace(/\/$/, '');
            const response = await this.apiClient.get<CustomerTypeDTO>(
                `${baseEndpoint}/${id}`,
                { requiresAuth: true }
            );
            return transformCustomerType(response);
        } catch (error) {
            console.error(`Error fetching CustomerType ${id}:`, error);
            throw error;
        }}

    async createCustomerType(input: CreateCustomerTypeInput): Promise<CustomerType> {
        try {
            const response = await this.apiClient.post<CustomerTypeDTO>(
                this.endpoints.customerTypes,
                input,
                { requiresAuth: true }
            );
            return transformCustomerType(response);
        } catch (error) {
            console.error('Error creating CustomerType:', error);
            throw error;
        }}

    async updateCustomerType(id: string, input: UpdateCustomerTypeInput): Promise<CustomerType> {
        try {
            const baseEndpoint = this.endpoints.customerTypes.replace(/\/$/, '');
            const response = await this.apiClient.put<CustomerTypeDTO>(
                `${baseEndpoint}/${id}`,
                input,
                { requiresAuth: true }
            );
            return transformCustomerType(response);
        } catch (error) {
            console.error(`Error updating CustomerType ${id}:`, error);
            throw error;
        }}

    async deleteCustomerType(id: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.customerTypes.replace(/\/$/, '');
            await this.apiClient.delete(
                `${baseEndpoint}/${id}`,
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error deleting CustomerType ${id}:`, error);
            throw error;
        }}
}
