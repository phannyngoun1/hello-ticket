/**
 * EventType Service
 *
 * Encapsulates all event-type-related API operations
 * Handles data transformation between backend and frontend types
 */

import type {EventType, CreateEventTypeInput, UpdateEventTypeInput } from './types';
import { ServiceConfig, PaginatedResponse, Pagination } from '@truths/shared';

// EventType DTO - Data Transfer Object matching API response format
interface EventTypeDTO {
    id: string;
    tenant_id: string;

    code: string;

    name: string;

    is_active: boolean;
    created_at: string;
    updated_at: string;
    deactivated_at?: string | null;
}

// Transform event-type DTO to frontend EventType type
function transformEventType(dto: EventTypeDTO): EventType {
    return {
        id: dto.id,

        code: dto.code,

        name: dto.name,

        created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
        updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
    };
}

// EventType service specific endpoints
interface EventTypeEndpoints extends Record<string, string> {eventTypes: string;
}

export type EventTypeServiceConfig = ServiceConfig<EventTypeEndpoints>;

export class EventTypeService {
    private apiClient: EventTypeServiceConfig['apiClient'];
    private endpoints: EventTypeServiceConfig['endpoints'];

    constructor(config: EventTypeServiceConfig) {
        this.apiClient = config.apiClient;
        this.endpoints = config.endpoints;
    }

    async fetchEventTypes(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        is_active?: boolean;
    }): Promise<PaginatedResponse<EventType>> {
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

            const baseEndpoint = this.endpoints.eventTypes.replace(/\/$/, '');
            const url = queryParams.toString()
                ? `${baseEndpoint}?${queryParams.toString()}`
                : baseEndpoint;

            const response = await this.apiClient.get<{
                items: EventTypeDTO[];
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
                data: (response.items || []).map(transformEventType),
                pagination,
            };
        } catch (error) {
            console.error('Error fetching EventType:', error);
            throw error;
        }}

    async searchEventTypes(query: string, limit: number = 100): Promise<EventType[]> {
        try {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) {
                return [];
            }

            const queryParams = new URLSearchParams();
            queryParams.append('search', trimmedQuery);
            queryParams.append('limit', Math.min(limit, 200).toString());

            const baseEndpoint = this.endpoints.eventTypes.replace(/\/$/, '');
            const url = `${baseEndpoint}?${queryParams.toString()}`;

            const response = await this.apiClient.get<{
                items: EventTypeDTO[];
                skip: number;
                limit: number;
                total: number;
                has_next: boolean;
            }>(
                url,
                { requiresAuth: true }
            );

            return (response.items || []).map(transformEventType);
        } catch (error) {
            console.error('Error searching EventType:', error);
            throw error;
        }}

    async fetchEventTypeById(id: string): Promise<EventType> {
        try {
            const baseEndpoint = this.endpoints.eventTypes.replace(/\/$/, '');
            const response = await this.apiClient.get<EventTypeDTO>(
                `${baseEndpoint}/${id}`,
                { requiresAuth: true }
            );
            return transformEventType(response);
        } catch (error) {
            console.error(`Error fetching EventType ${id}:`, error);
            throw error;
        }}

    async createEventType(input: CreateEventTypeInput): Promise<EventType> {
        try {
            const response = await this.apiClient.post<EventTypeDTO>(
                this.endpoints.eventTypes,
                input,
                { requiresAuth: true }
            );
            return transformEventType(response);
        } catch (error) {
            console.error('Error creating EventType:', error);
            throw error;
        }}

    async updateEventType(id: string, input: UpdateEventTypeInput): Promise<EventType> {
        try {
            const baseEndpoint = this.endpoints.eventTypes.replace(/\/$/, '');
            const response = await this.apiClient.put<EventTypeDTO>(
                `${baseEndpoint}/${id}`,
                input,
                { requiresAuth: true }
            );
            return transformEventType(response);
        } catch (error) {
            console.error(`Error updating EventType ${id}:`, error);
            throw error;
        }}

    async deleteEventType(id: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.eventTypes.replace(/\/$/, '');
            await this.apiClient.delete(
                `${baseEndpoint}/${id}`,
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error deleting EventType ${id}:`, error);
            throw error;
        }}
}
