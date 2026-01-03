/**
 * VenueType Service
 *
 * Encapsulates all venue-type-related API operations
 * Handles data transformation between backend and frontend types
 */

import type {VenueType, CreateVenueTypeInput, UpdateVenueTypeInput } from './types';
import { ServiceConfig, PaginatedResponse, Pagination } from '@truths/shared';

// VenueType DTO - Data Transfer Object matching API response format
interface VenueTypeDTO {
    id: string;
    tenant_id: string;

    code: string;

    name: string;

    is_active: boolean;
    created_at: string;
    updated_at: string;
    deactivated_at?: string | null;
}

// Transform venue-type DTO to frontend VenueType type
function transformVenueType(dto: VenueTypeDTO): VenueType {
    return {
        id: dto.id,

        code: dto.code,

        name: dto.name,

        created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
        updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
    };
}

// VenueType service specific endpoints
interface VenueTypeEndpoints extends Record<string, string> {venueTypes: string;
}

export type VenueTypeServiceConfig = ServiceConfig<VenueTypeEndpoints>;

export class VenueTypeService {
    private apiClient: VenueTypeServiceConfig['apiClient'];
    private endpoints: VenueTypeServiceConfig['endpoints'];

    constructor(config: VenueTypeServiceConfig) {
        this.apiClient = config.apiClient;
        this.endpoints = config.endpoints;
    }

    async fetchVenueTypes(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        is_active?: boolean;
    }): Promise<PaginatedResponse<VenueType>> {
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

            const baseEndpoint = this.endpoints.venueTypes.replace(/\/$/, '');
            const url = queryParams.toString()
                ? `${baseEndpoint}?${queryParams.toString()}`
                : baseEndpoint;

            const response = await this.apiClient.get<{
                items: VenueTypeDTO[];
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
                data: (response.items || []).map(transformVenueType),
                pagination,
            };
        } catch (error) {
            console.error('Error fetching VenueType:', error);
            throw error;
        }}

    async searchVenueTypes(query: string, limit: number = 100): Promise<VenueType[]> {
        try {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) {
                return [];
            }

            const queryParams = new URLSearchParams();
            queryParams.append('search', trimmedQuery);
            queryParams.append('limit', Math.min(limit, 200).toString());

            const baseEndpoint = this.endpoints.venueTypes.replace(/\/$/, '');
            const url = `${baseEndpoint}?${queryParams.toString()}`;

            const response = await this.apiClient.get<{
                items: VenueTypeDTO[];
                skip: number;
                limit: number;
                total: number;
                has_next: boolean;
            }>(
                url,
                { requiresAuth: true }
            );

            return (response.items || []).map(transformVenueType);
        } catch (error) {
            console.error('Error searching VenueType:', error);
            throw error;
        }}

    async fetchVenueTypeById(id: string): Promise<VenueType> {
        try {
            const baseEndpoint = this.endpoints.venueTypes.replace(/\/$/, '');
            const response = await this.apiClient.get<VenueTypeDTO>(
                `${baseEndpoint}/${id}`,
                { requiresAuth: true }
            );
            return transformVenueType(response);
        } catch (error) {
            console.error(`Error fetching VenueType ${id}:`, error);
            throw error;
        }}

    async createVenueType(input: CreateVenueTypeInput): Promise<VenueType> {
        try {
            const response = await this.apiClient.post<VenueTypeDTO>(
                this.endpoints.venueTypes,
                input,
                { requiresAuth: true }
            );
            return transformVenueType(response);
        } catch (error) {
            console.error('Error creating VenueType:', error);
            throw error;
        }}

    async updateVenueType(id: string, input: UpdateVenueTypeInput): Promise<VenueType> {
        try {
            const baseEndpoint = this.endpoints.venueTypes.replace(/\/$/, '');
            const response = await this.apiClient.put<VenueTypeDTO>(
                `${baseEndpoint}/${id}`,
                input,
                { requiresAuth: true }
            );
            return transformVenueType(response);
        } catch (error) {
            console.error(`Error updating VenueType ${id}:`, error);
            throw error;
        }}

    async deleteVenueType(id: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.venueTypes.replace(/\/$/, '');
            await this.apiClient.delete(
                `${baseEndpoint}/${id}`,
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error deleting VenueType ${id}:`, error);
            throw error;
        }}
}
