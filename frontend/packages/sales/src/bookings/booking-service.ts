/**
 * Booking Service
 *
 * Encapsulates all booking API operations and data transformations.
 */

import type { Booking, CreateBookingInput, UpdateBookingInput } from "./types";
import { ServiceConfig, PaginatedResponse, Pagination } from "@truths/shared";

interface BookingDTO {
  id: string;
  tenant_id: string;
  
  
  code: string;
  
  
  
  name: string;
  
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deactivated_at?: string | null;
}

// Transform DTO to frontend type - converts snake_case timestamps to Date objects
function transformBooking(dto: BookingDTO): Booking {
  return {
    id: dto.id,
    
    
    code: dto.code,
    
    
    
    name: dto.name,
    
    
    created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
    updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
  };
}

interface BookingEndpoints extends Record<string, string> {
  bookings: string;
}

export type BookingServiceConfig = ServiceConfig<BookingEndpoints>;

export class BookingService {
  private apiClient: BookingServiceConfig['apiClient'];
  private endpoints: BookingServiceConfig['endpoints'];

  constructor(config: BookingServiceConfig) {
    this.apiClient = config.apiClient;
    this.endpoints = config.endpoints;
  }

  async fetchBookings(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Booking>> {
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

      const baseEndpoint = this.endpoints.bookings.replace(/\/$/, '');
      const url = queryParams.toString()
        ? `${baseEndpoint}?${queryParams.toString()}`
        : baseEndpoint;

      const response = await this.apiClient.get<{
        items: BookingDTO[];
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
        data: (response.items || []).map(transformBooking),
        pagination,
      };
    } catch (error) {
      console.error('Error fetching Booking:', error);
      throw error;
    }
  }

  async searchBookings(query: string, limit: number = 100): Promise<Booking[]> {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        return [];
      }

      const queryParams = new URLSearchParams();
      queryParams.append('search', trimmedQuery);
      queryParams.append('limit', Math.min(limit, 200).toString());

      const baseEndpoint = this.endpoints.bookings.replace(/\/$/, '');
      const url = `${baseEndpoint}?${queryParams.toString()}`;

      const response = await this.apiClient.get<{
        items: BookingDTO[];
        skip: number;
        limit: number;
        total: number;
        has_next: boolean;
      }>(
        url,
        { requiresAuth: true }
      );

      return (response.items || []).map(transformBooking);
    } catch (error) {
      console.error('Error searching Booking:', error);
      throw error;
    }
  }

  async fetchBookingById(id: string): Promise<Booking> {
    try {
      const baseEndpoint = this.endpoints.bookings.replace(/\/$/, '');
      const response = await this.apiClient.get<BookingDTO>(
        `${baseEndpoint}/${id}`,
        { requiresAuth: true }
      );
      return transformBooking(response);
    } catch (error) {
      console.error(`Error fetching Booking ${id}:`, error);
      throw error;
    }
  }

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    try {
      const response = await this.apiClient.post<BookingDTO>(
        this.endpoints.bookings,
        input,
        { requiresAuth: true }
      );
      return transformBooking(response);
    } catch (error) {
      console.error('Error creating Booking:', error);
      throw error;
    }
  }

  async updateBooking(id: string, input: UpdateBookingInput): Promise<Booking> {
    try {
      const baseEndpoint = this.endpoints.bookings.replace(/\/$/, '');
      const response = await this.apiClient.put<BookingDTO>(
        `${baseEndpoint}/${id}`,
        input,
        { requiresAuth: true }
      );
      return transformBooking(response);
    } catch (error) {
      console.error(`Error updating Booking ${id}:`, error);
      throw error;
    }
  }

  async deleteBooking(id: string): Promise<void> {
    try {
      const baseEndpoint = this.endpoints.bookings.replace(/\/$/, '');
      await this.apiClient.delete(
        `${baseEndpoint}/${id}`,
        { requiresAuth: true }
      );
    } catch (error) {
      console.error(`Error deleting Booking ${id}:`, error);
      throw error;
    }
  }
}

// Default export
export default BookingService;
