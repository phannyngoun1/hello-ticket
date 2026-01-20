/**
 * Seat Service
 * 
 * Service for managing seats via API calls
 */
import { api } from "@truths/api";
import type { Seat, CreateSeatInput, UpdateSeatInput, SeatListResponse } from "./types";
import type { PlacementShape } from "./seat-designer/types";

const BASE_ENDPOINT = "/api/v1/ticketing/seats";

export const seatService = {
    /**
     * Get all seats for a venue
     */
    async getByVenue(venueId: string, skip = 0, limit = 1000): Promise<SeatListResponse> {
        return api.get<SeatListResponse>(
            `${BASE_ENDPOINT}?venue_id=${venueId}&skip=${skip}&limit=${limit}`,
            { requiresAuth: true }
        );
    },

    /**
     * Get all seats for a layout
     */
    async getByLayout(layoutId: string, skip = 0, limit = 1000): Promise<SeatListResponse> {
        return api.get<SeatListResponse>(
            `${BASE_ENDPOINT}?layout_id=${layoutId}&skip=${skip}&limit=${limit}`,
            { requiresAuth: true }
        );
    },

    /**
     * Get a seat by ID
     */
    async getById(seatId: string): Promise<Seat> {
        return api.get<Seat>(`${BASE_ENDPOINT}/${seatId}`, { requiresAuth: true });
    },

    /**
     * Create a new seat
     */
    async create(input: CreateSeatInput): Promise<Seat> {
        return api.post<Seat>(BASE_ENDPOINT, input, { requiresAuth: true });
    },

    /**
     * Update a seat
     */
    async update(seatId: string, input: UpdateSeatInput): Promise<Seat> {
        return api.put<Seat>(`${BASE_ENDPOINT}/${seatId}`, input, { requiresAuth: true });
    },

    /**
     * Update seat coordinates and shape
     */
    async updateCoordinates(seatId: string, x: number, y: number, shape?: PlacementShape): Promise<Seat> {
        return api.patch<Seat>(
            `${BASE_ENDPOINT}/${seatId}/coordinates`,
            {
                x_coordinate: x,
                y_coordinate: y,
                shape: shape ? JSON.stringify(shape) : undefined,
            },
            { requiresAuth: true }
        );
    },

    /**
     * Delete a seat
     */
    async delete(seatId: string): Promise<void> {
        return api.delete(`${BASE_ENDPOINT}/${seatId}`, { requiresAuth: true });
    },

    /**
     * Bulk seat operations (create, update, delete)
     * 
     * The 'seats' array contains all seat operations:
     * - No 'id' field: Create new seat
     * - Has 'id' field: Update existing seat
     * - Has 'id' field + 'delete' flag: Delete seat
     */
    async bulkOperations(options: {
        venueId: string;
        seats: Array<Partial<CreateSeatInput> & { id?: string; delete?: boolean }>;
        fileId?: string;
        layoutId?: string;
    }): Promise<Seat[]> {
        const payload: {
            seats: Array<Partial<CreateSeatInput> & { id?: string; delete?: boolean }>;
            file_id?: string;
        } = {
            seats: options.seats,
        };

        if (options.fileId) {
            payload.file_id = options.fileId;
        }

        const queryParams = new URLSearchParams({ venue_id: options.venueId });
        if (options.layoutId) {
            queryParams.append("layout_id", options.layoutId);
        }

        return api.post<Seat[]>(
            `${BASE_ENDPOINT}/bulk?${queryParams.toString()}`,
            payload,
            { requiresAuth: true }
        );
    },

    /**
     * Bulk create seats (legacy method for backward compatibility)
     */
    async bulkCreate(
        venueId: string,
        seats: Array<Partial<CreateSeatInput>>,
        fileId?: string,
        layoutId?: string
    ): Promise<Seat[]> {
        return this.bulkOperations({
            venueId,
            seats: seats.map(s => ({ ...s, id: undefined })), // Ensure no id for creates
            fileId,
            layoutId,
        });
    },

    /**
     * Delete all seats for a venue
     */
    async deleteByVenue(venueId: string): Promise<{ deleted_count: number }> {
        return api.delete<{ deleted_count: number }>(
            `${BASE_ENDPOINT}/venue/${venueId}`,
            { requiresAuth: true }
        );
    },

    /**
     * Auto-detect seats or sections from an uploaded floor plan
     */
    async autoDetect(fileId: string, target: 'seats' | 'sections'): Promise<SeatAutoDetectResponse> {
        return api.post<SeatAutoDetectResponse>(
            `${BASE_ENDPOINT}/auto-detect?file_id=${fileId}&target=${target}`,
            {},
            { requiresAuth: true }
        );
    },
};

export interface SeatAutoDetectResponse {
    candidates: Array<{
        x: number;
        y: number;
        radius?: number;
        width?: number;
        height?: number;
        type: 'circle' | 'rectangle' | 'polygon';
        points?: number[];
    }>;
}

