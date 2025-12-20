/**
 * Venue Service
 *
 * Encapsulates all venue API operations and data transformations.
 */

import type { Venue, CreateVenueInput, UpdateVenueInput } from "./types";
import { ServiceConfig, PaginatedResponse, Pagination } from "@truths/shared";

interface VenueDTO {
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
function transformVenue(dto: VenueDTO): Venue {
  return {
    id: dto.id,
    
    
    code: dto.code,
    
    
    
    name: dto.name,
    
    
    created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
    updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
  };
}

interface VenueEndpoints extends Record<string, string> {
  venues: string;
}

export type VenueServiceConfig = ServiceConfig<VenueEndpoints>;

export class VenueService {
  private apiClient: VenueServiceConfig['apiClient'];
  private endpoints: VenueServiceConfig['endpoints'];

  constructor(config: VenueServiceConfig) {
    this.apiClient = config.apiClient;
    this.endpoints = config.endpoints;
  }

  async fetchVenues(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Venue>> {
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

      const baseEndpoint = this.endpoints.venues.replace(/\/$/, '');
      const url = queryParams.toString()
        ? `${baseEndpoint}?${queryParams.toString()}`
        : baseEndpoint;

      const response = await this.apiClient.get<{
        items: VenueDTO[];
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
        data: (response.items || []).map(transformVenue),
        pagination,
      };
    } catch (error) {
      console.error('Error fetching Venue:', error);
      throw error;
    }
  }

  async searchVenues(query: string, limit: number = 100): Promise<Venue[]> {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        return [];
      }

      const queryParams = new URLSearchParams();
      queryParams.append('search', trimmedQuery);
      queryParams.append('limit', Math.min(limit, 200).toString());

      const baseEndpoint = this.endpoints.venues.replace(/\/$/, '');
      const url = `${baseEndpoint}?${queryParams.toString()}`;

      const response = await this.apiClient.get<{
        items: VenueDTO[];
        skip: number;
        limit: number;
        total: number;
        has_next: boolean;
      }>(
        url,
        { requiresAuth: true }
      );

      return (response.items || []).map(transformVenue);
    } catch (error) {
      console.error('Error searching Venue:', error);
      throw error;
    }
  }

  async fetchVenueById(id: string): Promise<Venue> {
    try {
      const baseEndpoint = this.endpoints.venues.replace(/\/$/, '');
      const response = await this.apiClient.get<VenueDTO>(
        `${baseEndpoint}/${id}`,
        { requiresAuth: true }
      );
      return transformVenue(response);
    } catch (error) {
      console.error(`Error fetching Venue ${id}:`, error);
      throw error;
    }
  }

  async createVenue(input: CreateVenueInput): Promise<Venue> {
    try {
      const response = await this.apiClient.post<VenueDTO>(
        this.endpoints.venues,
        input,
        { requiresAuth: true }
      );
      return transformVenue(response);
    } catch (error) {
      console.error('Error creating Venue:', error);
      throw error;
    }
  }

  async updateVenue(id: string, input: UpdateVenueInput): Promise<Venue> {
    try {
      const baseEndpoint = this.endpoints.venues.replace(/\/$/, '');
      const response = await this.apiClient.put<VenueDTO>(
        `${baseEndpoint}/${id}`,
        input,
        { requiresAuth: true }
      );
      return transformVenue(response);
    } catch (error) {
      console.error(`Error updating Venue ${id}:`, error);
      throw error;
    }
  }

  async deleteVenue(id: string): Promise<void> {
    try {
      const baseEndpoint = this.endpoints.venues.replace(/\/$/, '');
      await this.apiClient.delete(
        `${baseEndpoint}/${id}`,
        { requiresAuth: true }
      );
    } catch (error) {
      console.error(`Error deleting Venue ${id}:`, error);
      throw error;
    }
  }
}

// Default export
export default VenueService;
