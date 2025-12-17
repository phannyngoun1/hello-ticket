/**
 * TestBasic Service
 *
 * Encapsulates all test-basic-related API operations
 * Handles data transformation between backend and frontend types
 *
 * @author Phanny
 */

import type {TestBasic, CreateTestBasicInput, UpdateTestBasicInput } from './types';
import { ServiceConfig, PaginatedResponse, Pagination } from '@truths/shared';

// TestBasic DTO - Data Transfer Object matching API response format
interface TestBasicDTO {
    id: string;
    tenant_id: string;

    code: string;

    name: string;

    is_active: boolean;
    created_at: string;
    updated_at: string;
    deactivated_at?: string | null;
}

// Transform test-basic DTO to frontend TestBasic type
function transformTestBasic(dto: TestBasicDTO): TestBasic {
    return {
        id: dto.id,

        code: dto.code,

        name: dto.name,

        created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
        updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
    };
}

// TestBasic service specific endpoints
interface TestBasicEndpoints extends Record<string, string> {testBasics: string;
}

export type TestBasicServiceConfig = ServiceConfig<TestBasicEndpoints>;

export class TestBasicService {
    private apiClient: TestBasicServiceConfig['apiClient'];
    private endpoints: TestBasicServiceConfig['endpoints'];

    constructor(config: TestBasicServiceConfig) {
        this.apiClient = config.apiClient;
        this.endpoints = config.endpoints;
    }

    async fetchTestBasics(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        is_active?: boolean;
    }): Promise<PaginatedResponse<TestBasic>> {
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

            const baseEndpoint = this.endpoints.testBasics.replace(/\/$/, '');
            const url = queryParams.toString()
                ? `${baseEndpoint}?${queryParams.toString()}`
                : baseEndpoint;

            const response = await this.apiClient.get<{
                items: TestBasicDTO[];
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
                data: (response.items || []).map(transformTestBasic),
                pagination,
            };
        } catch (error) {
            console.error('Error fetching TestBasic:', error);
            throw error;
        }}

    async searchTestBasics(query: string, limit: number = 100): Promise<TestBasic[]> {
        try {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) {
                return [];
            }

            const queryParams = new URLSearchParams();
            queryParams.append('search', trimmedQuery);
            queryParams.append('limit', Math.min(limit, 200).toString());

            const baseEndpoint = this.endpoints.testBasics.replace(/\/$/, '');
            const url = `${baseEndpoint}?${queryParams.toString()}`;

            const response = await this.apiClient.get<{
                items: TestBasicDTO[];
                skip: number;
                limit: number;
                total: number;
                has_next: boolean;
            }>(
                url,
                { requiresAuth: true }
            );

            return (response.items || []).map(transformTestBasic);
        } catch (error) {
            console.error('Error searching TestBasic:', error);
            throw error;
        }}

    async fetchTestBasicById(id: string): Promise<TestBasic> {
        try {
            const baseEndpoint = this.endpoints.testBasics.replace(/\/$/, '');
            const response = await this.apiClient.get<TestBasicDTO>(
                `${baseEndpoint}/${id}`,
                { requiresAuth: true }
            );
            return transformTestBasic(response);
        } catch (error) {
            console.error(`Error fetching TestBasic ${id}:`, error);
            throw error;
        }}

    async createTestBasic(input: CreateTestBasicInput): Promise<TestBasic> {
        try {
            const response = await this.apiClient.post<TestBasicDTO>(
                this.endpoints.testBasics,
                input,
                { requiresAuth: true }
            );
            return transformTestBasic(response);
        } catch (error) {
            console.error('Error creating TestBasic:', error);
            throw error;
        }}

    async updateTestBasic(id: string, input: UpdateTestBasicInput): Promise<TestBasic> {
        try {
            const baseEndpoint = this.endpoints.testBasics.replace(/\/$/, '');
            const response = await this.apiClient.put<TestBasicDTO>(
                `${baseEndpoint}/${id}`,
                input,
                { requiresAuth: true }
            );
            return transformTestBasic(response);
        } catch (error) {
            console.error(`Error updating TestBasic ${id}:`, error);
            throw error;
        }}

    async deleteTestBasic(id: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.testBasics.replace(/\/$/, '');
            await this.apiClient.delete(
                `${baseEndpoint}/${id}`,
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error deleting TestBasic ${id}:`, error);
            throw error;
        }}
}
