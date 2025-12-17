/**
 * UoM Service
 * 
 * Encapsulates all unit of measure-related API operations
 * Handles data transformation between backend and frontend types
 *
 * @author Phanny
 */

import type { UnitOfMeasure } from '../types';
import { ServiceConfig, PaginatedResponse, Pagination } from '@truths/shared';

// Unit of Measure DTO - Data Transfer Object matching API response format
interface UnitOfMeasureDTO {
    id: string;
    code: string;
    name: string;
    base_uom: string;
    conversion_factor: number;
    created_at?: string;
    updated_at?: string;
}

// Transform unit of measure DTO to frontend UnitOfMeasure type
function transformUnitOfMeasure(dto: UnitOfMeasureDTO): UnitOfMeasure {
    return {
        id: dto.id,
        code: dto.code,
        name: dto.name,
        base_uom: dto.base_uom,
        conversion_factor: dto.conversion_factor,
        created_at: dto.created_at || new Date().toISOString(),
        updated_at: dto.updated_at || new Date().toISOString(),
    };
}

// UoM service specific endpoints
interface UoMEndpoints extends Record<string, string> {
    uom: string;
}

export type UoMServiceConfig = ServiceConfig<UoMEndpoints>;

export class UoMService {
    private apiClient: UoMServiceConfig['apiClient'];
    private endpoints: UoMServiceConfig['endpoints'];

    constructor(config: UoMServiceConfig) {
        this.apiClient = config.apiClient;
        this.endpoints = config.endpoints;
    }

    async fetchUoM(params?: {
        skip?: number;
        limit?: number;
        search?: string;
    }): Promise<PaginatedResponse<UnitOfMeasure>> {
        try {
            const queryParams = new URLSearchParams();

            if (params?.skip !== undefined) {
                queryParams.append('skip', params.skip.toString());
            }
            if (params?.limit !== undefined) {
                queryParams.append('limit', params.limit.toString());
            }

            const url = queryParams.toString()
                ? `${this.endpoints.uom}/?${queryParams.toString()}`
                : this.endpoints.uom;

            const response = await this.apiClient.get<{
                items: UnitOfMeasureDTO[];
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
                page: response.page || Math.floor((params?.skip || 0) / (params?.limit || 100)) + 1,
                pageSize: response.limit || params?.limit || 100,
                total: response.total,
                totalPages: response.total_pages,
            };

            return {
                data: (response.items || []).map(transformUnitOfMeasure),
                pagination,
            };
        } catch (error) {
            console.error('Error fetching UoM:', error);
            throw error;
        }
    }

    async searchUoM(query: string, limit: number = 100): Promise<UnitOfMeasure[]> {
        try {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) {
                return [];
            }

            const queryParams = new URLSearchParams();
            queryParams.append('q', trimmedQuery);
            if (limit) {
                queryParams.append('limit', Math.min(limit, 1000).toString());
            }

            const baseEndpoint = this.endpoints.uom.replace(/\/$/, '');
            const url = `${baseEndpoint}/search?${queryParams.toString()}`;

            const response = await this.apiClient.get<{
                items: UnitOfMeasureDTO[];
                skip: number;
                limit: number;
                has_next: boolean;
            }>(
                url,
                { requiresAuth: true }
            );

            return (response.items || []).map(transformUnitOfMeasure);
        } catch (error) {
            console.error('Error searching UoM:', error);
            throw error;
        }
    }

    async fetchUoMById(id: string): Promise<UnitOfMeasure> {
        try {
            const baseEndpoint = this.endpoints.uom.replace(/\/$/, '');
            const response = await this.apiClient.get<UnitOfMeasureDTO>(
                `${baseEndpoint}/${id}`,
                { requiresAuth: true }
            );
            return transformUnitOfMeasure(response);
        } catch (error) {
            console.error(`Error fetching UoM ${id}:`, error);
            throw error;
        }
    }

    async createUoM(input: {
        code: string;
        name: string;
        base_uom: string;
        conversion_factor: number;
    }): Promise<UnitOfMeasure> {
        try {
            const response = await this.apiClient.post<UnitOfMeasureDTO>(
                this.endpoints.uom,
                input,
                { requiresAuth: true }
            );
            return transformUnitOfMeasure(response);
        } catch (error) {
            console.error('Error creating UoM:', error);
            throw error;
        }
    }

    async updateUoM(id: string, input: {
        code?: string;
        name?: string;
        base_uom?: string;
        conversion_factor?: number;
    }): Promise<UnitOfMeasure> {
        try {
            const baseEndpoint = this.endpoints.uom.replace(/\/$/, '');
            const response = await this.apiClient.put<UnitOfMeasureDTO>(
                `${baseEndpoint}/${id}`,
                input,
                { requiresAuth: true }
            );
            return transformUnitOfMeasure(response);
        } catch (error) {
            console.error(`Error updating UoM ${id}:`, error);
            throw error;
        }
    }

    async deleteUoM(id: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.uom.replace(/\/$/, '');
            await this.apiClient.delete(
                `${baseEndpoint}/${id}`,
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error deleting UoM ${id}:`, error);
            throw error;
        }
    }
}

// Default export
export default UoMService;

