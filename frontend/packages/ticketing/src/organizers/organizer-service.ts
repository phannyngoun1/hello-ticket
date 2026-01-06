/**
 * Organizer Service
 *
 * Encapsulates all organizer API operations and data transformations.
 */

import type { Organizer, CreateOrganizerInput, UpdateOrganizerInput } from "./types";
import { ServiceConfig, PaginatedResponse, Pagination } from "@truths/shared";

interface OrganizerDTO {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  logo?: string | null;
  tags?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deactivated_at?: string | null;
}

// Transform DTO to frontend type - converts snake_case timestamps to Date objects
function transformOrganizer(dto: OrganizerDTO): Organizer {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description,
    email: dto.email,
    phone: dto.phone,
    website: dto.website,
    address: dto.address,
    city: dto.city,
    country: dto.country,
    logo: dto.logo,
    tags: dto.tags || [],
    created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
    updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
  };
}

interface OrganizerEndpoints extends Record<string, string> {
  organizers: string;
}

export type OrganizerServiceConfig = ServiceConfig<OrganizerEndpoints>;

export class OrganizerService {
  private apiClient: OrganizerServiceConfig['apiClient'];
  private endpoints: OrganizerServiceConfig['endpoints'];

  constructor(config: OrganizerServiceConfig) {
    this.apiClient = config.apiClient;
    this.endpoints = config.endpoints;
  }

  async fetchOrganizers(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Organizer>> {
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

      const baseEndpoint = this.endpoints.organizers.replace(/\/$/, '');
      const url = queryParams.toString()
        ? `${baseEndpoint}?${queryParams.toString()}`
        : baseEndpoint;

      const response = await this.apiClient.get<{
        items: OrganizerDTO[];
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
        data: (response.items || []).map(transformOrganizer),
        pagination,
      };
    } catch (error) {
      console.error('Error fetching Organizer:', error);
      throw error;
    }
  }

  async searchOrganizers(query: string, limit: number = 100): Promise<Organizer[]> {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        return [];
      }

      const queryParams = new URLSearchParams();
      queryParams.append('search', trimmedQuery);
      queryParams.append('limit', Math.min(limit, 200).toString());

      const baseEndpoint = this.endpoints.organizers.replace(/\/$/, '');
      const url = `${baseEndpoint}?${queryParams.toString()}`;

      const response = await this.apiClient.get<{
        items: OrganizerDTO[];
        skip: number;
        limit: number;
        total: number;
        has_next: boolean;
      }>(
        url,
        { requiresAuth: true }
      );

      return (response.items || []).map(transformOrganizer);
    } catch (error) {
      console.error('Error searching Organizer:', error);
      throw error;
    }
  }

  async fetchOrganizerById(id: string): Promise<Organizer> {
    try {
      const baseEndpoint = this.endpoints.organizers.replace(/\/$/, '');
      const response = await this.apiClient.get<OrganizerDTO>(
        `${baseEndpoint}/${id}`,
        { requiresAuth: true }
      );
      return transformOrganizer(response);
    } catch (error) {
      console.error(`Error fetching Organizer ${id}:`, error);
      throw error;
    }
  }

  async createOrganizer(input: CreateOrganizerInput): Promise<Organizer> {
    try {
      const response = await this.apiClient.post<OrganizerDTO>(
        this.endpoints.organizers,
        input,
        { requiresAuth: true }
      );
      return transformOrganizer(response);
    } catch (error) {
      console.error('Error creating Organizer:', error);
      throw error;
    }
  }

  async updateOrganizer(id: string, input: UpdateOrganizerInput): Promise<Organizer> {
    try {
      const baseEndpoint = this.endpoints.organizers.replace(/\/$/, '');
      const response = await this.apiClient.put<OrganizerDTO>(
        `${baseEndpoint}/${id}`,
        input,
        { requiresAuth: true }
      );
      return transformOrganizer(response);
    } catch (error) {
      console.error(`Error updating Organizer ${id}:`, error);
      throw error;
    }
  }

  async deleteOrganizer(id: string): Promise<void> {
    try {
      const baseEndpoint = this.endpoints.organizers.replace(/\/$/, '');
      await this.apiClient.delete(
        `${baseEndpoint}/${id}`,
        { requiresAuth: true }
      );
    } catch (error) {
      console.error(`Error deleting Organizer ${id}:`, error);
      throw error;
    }
  }
}

// Default export
export default OrganizerService;
