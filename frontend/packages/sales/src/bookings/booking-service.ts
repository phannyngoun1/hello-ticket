/**
 * Booking Service
 *
 * Encapsulates all booking API operations and data transformations.
 */

import type { Booking, CreateBookingInput, UpdateBookingInput } from "./types";
import { ServiceConfig, PaginatedResponse, Pagination } from "@truths/shared";

interface BookingItemDTO {
  id?: string;
  event_seat_id: string;
  ticket_id?: string;
  section_name?: string;
  row_name?: string;
  seat_number?: string;
  unit_price: number;
  total_price: number;
  currency?: string;
  ticket_number?: string;
  ticket_status?: string;
}

interface BookingDTO {
  id: string;
  tenant_id: string;
  booking_number: string;
  customer_id?: string;
  salesperson_id?: string;
  event_id: string;
  status: string;
  subtotal_amount: number;
  discount_amount: number;
  discount_type?: string;
  discount_value?: number;
  tax_amount: number;
  tax_rate: number;
  total_amount: number;
  currency: string;
  payment_status?: string;
  due_balance: number;
  reserved_until?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  items?: BookingItemDTO[];
  created_at: string;
  updated_at?: string;
  version?: number;
}

// Transform DTO to frontend type - converts snake_case timestamps to Date objects
function transformBooking(dto: BookingDTO): Booking {
  return {
    id: dto.id,
    tenant_id: dto.tenant_id,
    booking_number: dto.booking_number,
    customer_id: dto.customer_id,
    salesperson_id: dto.salesperson_id,
    event_id: dto.event_id,
    status: dto.status,
    subtotal_amount: dto.subtotal_amount,
    discount_amount: dto.discount_amount,
    discount_type: dto.discount_type,
    discount_value: dto.discount_value,
    tax_amount: dto.tax_amount,
    tax_rate: dto.tax_rate,
    total_amount: dto.total_amount,
    currency: dto.currency,
    payment_status: dto.payment_status,
    due_balance: dto.due_balance,
    reserved_until: dto.reserved_until ? new Date(dto.reserved_until) : undefined,
    cancelled_at: dto.cancelled_at ? new Date(dto.cancelled_at) : undefined,
    cancellation_reason: dto.cancellation_reason,
    items: dto.items || [],
    created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
    updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
    version: dto.version,
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
    status?: string;
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
      if (params?.status !== undefined) {
        queryParams.append('status', params.status);
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

  async deleteBooking(id: string, cancellationReason: string): Promise<void> {
    try {
      const baseEndpoint = this.endpoints.bookings.replace(/\/$/, '');
      const params = new URLSearchParams({ cancellation_reason: cancellationReason });
      const endpoint = `${baseEndpoint}/${id}?${params.toString()}`;
      await this.apiClient.delete(
        endpoint,
        { requiresAuth: true }
      );
    } catch (error) {
      console.error(`Error cancelling Booking ${id}:`, error);
      throw error;
    }
  }
}

// Default export
export default BookingService;
