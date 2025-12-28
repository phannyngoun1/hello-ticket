/**
 * Event Service
 *
 * Encapsulates all event API operations and data transformations.
 */

import type { Event, CreateEventInput, UpdateEventInput, EventSeat, EventSeatStatus, BrokerSeatImportItem } from "./types";
import { ServiceConfig, PaginatedResponse, Pagination } from "@truths/shared";
import { EventStatus, EventConfigurationType } from "./types";

interface EventDTO {
  id: string;
  tenant_id: string;
  show_id: string;
  title: string;
  start_dt: string;
  duration_minutes: number;
  venue_id: string;
  layout_id?: string | null;
  status: string;
  configuration_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EventSeatDTO {
  id: string;
  tenant_id: string;
  event_id: string;
  status: string;
  seat_id?: string | null;
  section_name?: string | null;
  row_name?: string | null;
  seat_number?: string | null;
  price: number;
  ticket_code?: string | null;
  broker_id?: string | null;
  attributes: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Transform DTO to frontend type - converts snake_case timestamps to Date objects
function transformEvent(dto: EventDTO): Event {
  return {
    id: dto.id,
    tenant_id: dto.tenant_id,
    show_id: dto.show_id,
    title: dto.title,
    start_dt: new Date(dto.start_dt),
    duration_minutes: dto.duration_minutes,
    venue_id: dto.venue_id,
    layout_id: dto.layout_id || undefined,
    status: dto.status as EventStatus,
    configuration_type: dto.configuration_type as EventConfigurationType,
    is_active: dto.is_active,
    created_at: new Date(dto.created_at),
    updated_at: new Date(dto.updated_at),
  };
}

function transformEventSeat(dto: EventSeatDTO): EventSeat {
  return {
    id: dto.id,
    tenant_id: dto.tenant_id,
    event_id: dto.event_id,
    status: dto.status as EventSeatStatus,
    seat_id: dto.seat_id || undefined,
    section_name: dto.section_name || undefined,
    row_name: dto.row_name || undefined,
    seat_number: dto.seat_number || undefined,
    price: dto.price,
    ticket_code: dto.ticket_code || undefined,
    broker_id: dto.broker_id || undefined,
    attributes: dto.attributes || {},
    created_at: new Date(dto.created_at),
    updated_at: new Date(dto.updated_at),
  };
}

interface EventEndpoints extends Record<string, string> {
  events: string;
}

export type EventServiceConfig = ServiceConfig<EventEndpoints>;

export class EventService {
  private apiClient: EventServiceConfig['apiClient'];
  private endpoints: EventServiceConfig['endpoints'];

  constructor(config: EventServiceConfig) {
    this.apiClient = config.apiClient;
    this.endpoints = config.endpoints;
  }

  async fetchEvents(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
    show_id?: string;
  }): Promise<PaginatedResponse<Event>> {
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
      if (params?.show_id !== undefined) {
        queryParams.append('show_id', params.show_id);
      }

      const baseEndpoint = this.endpoints.events.replace(/\/$/, '');
      const url = queryParams.toString()
        ? `${baseEndpoint}?${queryParams.toString()}`
        : baseEndpoint;

      const response = await this.apiClient.get<{
        items: EventDTO[];
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
        data: (response.items || []).map(transformEvent),
        pagination,
      };
    } catch (error) {
      console.error('Error fetching Event:', error);
      throw error;
    }
  }

  async searchEvents(query: string, limit: number = 100, show_id?: string): Promise<Event[]> {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        return [];
      }

      const queryParams = new URLSearchParams();
      queryParams.append('search', trimmedQuery);
      queryParams.append('limit', Math.min(limit, 200).toString());
      if (show_id) {
        queryParams.append('show_id', show_id);
      }

      const baseEndpoint = this.endpoints.events.replace(/\/$/, '');
      const url = `${baseEndpoint}?${queryParams.toString()}`;

      const response = await this.apiClient.get<{
        items: EventDTO[];
        skip: number;
        limit: number;
        total: number;
        has_next: boolean;
      }>(
        url,
        { requiresAuth: true }
      );

      return (response.items || []).map(transformEvent);
    } catch (error) {
      console.error('Error searching Event:', error);
      throw error;
    }
  }

  async fetchEventById(id: string): Promise<Event> {
    try {
      const baseEndpoint = this.endpoints.events.replace(/\/$/, '');
      const response = await this.apiClient.get<EventDTO>(
        `${baseEndpoint}/${id}`,
        { requiresAuth: true }
      );
      return transformEvent(response);
    } catch (error) {
      console.error(`Error fetching Event ${id}:`, error);
      throw error;
    }
  }

  async createEvent(input: CreateEventInput): Promise<Event> {
    try {
      const response = await this.apiClient.post<EventDTO>(
        this.endpoints.events,
        input,
        { requiresAuth: true }
      );
      return transformEvent(response);
    } catch (error) {
      console.error('Error creating Event:', error);
      throw error;
    }
  }

  async updateEvent(id: string, input: UpdateEventInput): Promise<Event> {
    try {
      const baseEndpoint = this.endpoints.events.replace(/\/$/, '');
      const response = await this.apiClient.put<EventDTO>(
        `${baseEndpoint}/${id}`,
        input,
        { requiresAuth: true }
      );
      return transformEvent(response);
    } catch (error) {
      console.error(`Error updating Event ${id}:`, error);
      throw error;
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      const baseEndpoint = this.endpoints.events.replace(/\/$/, '');
      await this.apiClient.delete(
        `${baseEndpoint}/${id}`,
        { requiresAuth: true }
      );
    } catch (error) {
      console.error(`Error deleting Event ${id}:`, error);
      throw error;
    }
  }

  async fetchEventSeats(eventId: string, params?: { skip?: number, limit?: number }): Promise<PaginatedResponse<EventSeat>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
      if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());

      const baseEndpoint = this.endpoints.events.replace(/\/$/, '');
      const url = `${baseEndpoint}/${eventId}/seats?${queryParams.toString()}`;

      const response = await this.apiClient.get<{
        items: EventSeatDTO[];
        total: number;
        skip: number;
        limit: number;
        has_next: boolean;
      }>(url, { requiresAuth: true });

      const skip = response.skip ?? params?.skip ?? 0;
      const limit = response.limit ?? params?.limit ?? 100;
      const total = response.total ?? 0;

      return {
        data: (response.items || []).map(transformEventSeat),
        pagination: {
          page: Math.floor(skip / limit) + 1,
          pageSize: limit,
          total: total,
          totalPages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      console.error(`Error fetching seats for Event ${eventId}:`, error);
      throw error;
    }
  }

  async initializeEventSeats(eventId: string): Promise<EventSeat[]> {
    try {
      const baseEndpoint = this.endpoints.events.replace(/\/$/, '');
      const response = await this.apiClient.post<EventSeatDTO[]>(
        `${baseEndpoint}/${eventId}/seats/initialize`,
        {},
        { requiresAuth: true }
      );
      return (response || []).map(transformEventSeat);
    } catch (error) {
      console.error(`Error initializing seats for Event ${eventId}:`, error);
      throw error;
    }
  }

  async importBrokerSeats(eventId: string, brokerId: string, seats: BrokerSeatImportItem[]): Promise<EventSeat[]> {
    try {
      const baseEndpoint = this.endpoints.events.replace(/\/$/, '');
      const response = await this.apiClient.post<EventSeatDTO[]>(
        `${baseEndpoint}/${eventId}/seats/import`,
        { broker_id: brokerId, seats },
        { requiresAuth: true }
      );
      return (response || []).map(transformEventSeat);
    } catch (error) {
      console.error(`Error importing broker seats for Event ${eventId}:`, error);
      throw error;
    }
  }

  async deleteEventSeats(eventId: string, seatIds: string[]): Promise<void> {
    try {
      const baseEndpoint = this.endpoints.events.replace(/\/$/, '');
      // Use POST for bulk delete with body
      await this.apiClient.post(
        `${baseEndpoint}/${eventId}/seats/delete`,
        { seat_ids: seatIds },
        { requiresAuth: true }
      );
    } catch (error) {
      console.error(`Error deleting seats for Event ${eventId}:`, error);
      throw error;
    }
  }
}

// Default export
export default EventService;

