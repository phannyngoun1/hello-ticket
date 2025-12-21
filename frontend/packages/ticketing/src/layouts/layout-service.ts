/**
 * Layout Service
 *
 * Encapsulates all layout API operations and data transformations.
 */

import type { Layout, CreateLayoutInput, UpdateLayoutInput } from "./types";
import type { Seat } from "../seats/types";
import { ServiceConfig } from "@truths/shared";

interface LayoutDTO {
  id: string;
  tenant_id: string;
  venue_id: string;
  name: string;
  description?: string | null;
  image_url?: string | null; // URL to the layout image file (from file_id)
  file_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Transform DTO to frontend type - converts snake_case timestamps to Date objects
function transformLayout(dto: LayoutDTO): Layout {
  return {
    id: dto.id,
    tenant_id: dto.tenant_id,
    venue_id: dto.venue_id,
    name: dto.name,
    description: dto.description || undefined,
    image_url: dto.image_url || undefined, // Now populated from backend when file_id exists
    file_id: dto.file_id || undefined,
    is_active: dto.is_active,
    created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
    updated_at: dto.updated_at ? new Date(dto.updated_at) : new Date(),
  };
}

interface LayoutEndpoints extends Record<string, string> {
  layouts: string;
}

export type LayoutServiceConfig = ServiceConfig<LayoutEndpoints>;

export class LayoutService {
  private apiClient: LayoutServiceConfig['apiClient'];
  private endpoints: LayoutServiceConfig['endpoints'];

  constructor(config: LayoutServiceConfig) {
    this.apiClient = config.apiClient;
    this.endpoints = config.endpoints;
  }

  async fetchLayoutsByVenue(venueId: string): Promise<Layout[]> {
    try {
      const response = await this.apiClient.get<{
        items: LayoutDTO[];
      }>(
        `${this.endpoints.layouts}/venue/${venueId}`,
        { requiresAuth: true }
      );
      return (response.items || []).map(transformLayout);
    } catch (error) {
      console.error(`Error fetching layouts for venue ${venueId}:`, error);
      throw error;
    }
  }

  async fetchLayoutById(id: string): Promise<Layout> {
    try {
      const response = await this.apiClient.get<LayoutDTO>(
        `${this.endpoints.layouts}/${id}`,
        { requiresAuth: true }
      );
      return transformLayout(response);
    } catch (error) {
      console.error(`Error fetching layout ${id}:`, error);
      throw error;
    }
  }

  async createLayout(input: CreateLayoutInput): Promise<Layout> {
    try {
      const response = await this.apiClient.post<LayoutDTO>(
        this.endpoints.layouts,
        input,
        { requiresAuth: true }
      );
      return transformLayout(response);
    } catch (error) {
      console.error('Error creating layout:', error);
      throw error;
    }
  }

  async updateLayout(id: string, input: UpdateLayoutInput): Promise<Layout> {
    try {
      const response = await this.apiClient.put<LayoutDTO>(
        `${this.endpoints.layouts}/${id}`,
        input,
        { requiresAuth: true }
      );
      return transformLayout(response);
    } catch (error) {
      console.error(`Error updating layout ${id}:`, error);
      throw error;
    }
  }

  async deleteLayout(id: string): Promise<void> {
    try {
      await this.apiClient.delete(
        `${this.endpoints.layouts}/${id}`,
        { requiresAuth: true }
      );
    } catch (error) {
      console.error(`Error deleting layout ${id}:`, error);
      throw error;
    }
  }

  async fetchLayoutWithSeats(id: string): Promise<{
    layout: Layout;
    seats: Seat[];
  }> {
    try {
      const response = await this.apiClient.get<{
        layout: LayoutDTO;
        seats: Array<{
          id: string;
          tenant_id: string;
          venue_id: string;
          layout_id: string;
          section: string;
          row: string;
          seat_number: string;
          seat_type: string;
          x_coordinate?: number | null;
          y_coordinate?: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        }>;
      }>(
        `${this.endpoints.layouts}/${id}/with-seats`,
        { requiresAuth: true }
      );
      return {
        layout: transformLayout(response.layout),
        seats: response.seats.map((seat) => ({
          id: seat.id,
          tenant_id: seat.tenant_id,
          venue_id: seat.venue_id,
          layout_id: seat.layout_id,
          section: seat.section,
          row: seat.row,
          seat_number: seat.seat_number,
          seat_type: seat.seat_type as any,
          x_coordinate: seat.x_coordinate ?? undefined,
          y_coordinate: seat.y_coordinate ?? undefined,
          is_active: seat.is_active,
          created_at: seat.created_at ? new Date(seat.created_at) : new Date(),
          updated_at: seat.updated_at ? new Date(seat.updated_at) : new Date(),
        })),
      };
    } catch (error) {
      console.error(`Error fetching layout with seats ${id}:`, error);
      throw error;
    }
  }
}

// Default export
export default LayoutService;
