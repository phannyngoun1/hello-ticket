/**
 * Show Service
 *
 * Encapsulates all show API operations and data transformations.
 */

import type { Show, CreateShowInput, UpdateShowInput, ShowImage, CreateShowImageInput, UpdateShowImageInput, ShowOrganizer } from "./types";
import { ServiceConfig, PaginatedResponse, Pagination } from "@truths/shared";

interface ShowDTO {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  organizer_id?: string | null;
  organizer?: {
    id: string;
    code: string;
    name: string;
  } | null;
  started_date?: string | null;
  ended_date?: string | null;
  note?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deactivated_at?: string | null;
}

// Transform DTO to frontend type - converts snake_case timestamps to Date objects
function transformShow(dto: ShowDTO): Show {
  return {
    id: dto.id,
    code: dto.code || undefined,
    name: dto.name,
    organizer_id: dto.organizer_id || undefined,
    organizer: dto.organizer ? {
      id: dto.organizer.id,
      code: dto.organizer.code,
      name: dto.organizer.name,
    } as ShowOrganizer : undefined,
    started_date: dto.started_date || undefined,
    ended_date: dto.ended_date || undefined,
    note: dto.note || undefined,
    created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
    updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
  };
}

interface ShowEndpoints extends Record<string, string> {
  shows: string;
}

export type ShowServiceConfig = ServiceConfig<ShowEndpoints>;

export class ShowService {
  private apiClient: ShowServiceConfig['apiClient'];
  private endpoints: ShowServiceConfig['endpoints'];

  constructor(config: ShowServiceConfig) {
    this.apiClient = config.apiClient;
    this.endpoints = config.endpoints;
  }

  async fetchShows(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Show>> {
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

      const baseEndpoint = this.endpoints.shows.replace(/\/$/, '');
      const url = queryParams.toString()
        ? `${baseEndpoint}?${queryParams.toString()}`
        : baseEndpoint;

      const response = await this.apiClient.get<{
        items: ShowDTO[];
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
        data: (response.items || []).map(transformShow),
        pagination,
      };
    } catch (error) {
      console.error('Error fetching Show:', error);
      throw error;
    }
  }

  async searchShows(query: string, limit: number = 100): Promise<Show[]> {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        return [];
      }

      const queryParams = new URLSearchParams();
      queryParams.append('search', trimmedQuery);
      queryParams.append('limit', Math.min(limit, 200).toString());

      const baseEndpoint = this.endpoints.shows.replace(/\/$/, '');
      const url = `${baseEndpoint}?${queryParams.toString()}`;

      const response = await this.apiClient.get<{
        items: ShowDTO[];
        skip: number;
        limit: number;
        total: number;
        has_next: boolean;
      }>(
        url,
        { requiresAuth: true }
      );

      return (response.items || []).map(transformShow);
    } catch (error) {
      console.error('Error searching Show:', error);
      throw error;
    }
  }

  async fetchShowById(id: string): Promise<Show> {
    try {
      const baseEndpoint = this.endpoints.shows.replace(/\/$/, '');
      const response = await this.apiClient.get<ShowDTO>(
        `${baseEndpoint}/${id}`,
        { requiresAuth: true }
      );
      return transformShow(response);
    } catch (error) {
      console.error(`Error fetching Show ${id}:`, error);
      throw error;
    }
  }

  async createShow(input: CreateShowInput): Promise<Show> {
    try {
      const response = await this.apiClient.post<ShowDTO>(
        this.endpoints.shows,
        input,
        { requiresAuth: true }
      );
      return transformShow(response);
    } catch (error) {
      console.error('Error creating Show:', error);
      throw error;
    }
  }

  async updateShow(id: string, input: UpdateShowInput): Promise<Show> {
    try {
      const baseEndpoint = this.endpoints.shows.replace(/\/$/, '');
      const response = await this.apiClient.put<ShowDTO>(
        `${baseEndpoint}/${id}`,
        input,
        { requiresAuth: true }
      );
      return transformShow(response);
    } catch (error) {
      console.error(`Error updating Show ${id}:`, error);
      throw error;
    }
  }

  async deleteShow(id: string): Promise<void> {
    try {
      const baseEndpoint = this.endpoints.shows.replace(/\/$/, '');
      await this.apiClient.delete(
        `${baseEndpoint}/${id}`,
        { requiresAuth: true }
      );
    } catch (error) {
      console.error(`Error deleting Show ${id}:`, error);
      throw error;
    }
  }

  // Show Image methods
  async fetchShowImages(showId: string): Promise<ShowImage[]> {
    try {
      const baseEndpoint = this.endpoints.shows.replace(/\/$/, '');
      const response = await this.apiClient.get<ShowImage[]>(
        `${baseEndpoint}/${showId}/images`,
        { requiresAuth: true }
      );
      return (response || []).map(img => ({
        ...img,
        created_at: img.created_at ? new Date(img.created_at) : new Date(),
        updated_at: img.updated_at ? new Date(img.updated_at) : new Date(),
      }));
    } catch (error) {
      console.error(`Error fetching images for show ${showId}:`, error);
      throw error;
    }
  }

  async createShowImage(input: CreateShowImageInput): Promise<ShowImage> {
    try {
      const baseEndpoint = this.endpoints.shows.replace(/\/$/, '');
      const response = await this.apiClient.post<ShowImage>(
        `${baseEndpoint}/${input.show_id}/images`,
        input,
        { requiresAuth: true }
      );
      return {
        ...response,
        created_at: response.created_at ? new Date(response.created_at) : new Date(),
        updated_at: response.updated_at ? new Date(response.updated_at) : new Date(),
      };
    } catch (error) {
      console.error('Error creating show image:', error);
      throw error;
    }
  }

  async updateShowImage(showId: string, imageId: string, input: UpdateShowImageInput): Promise<ShowImage> {
    try {
      const baseEndpoint = this.endpoints.shows.replace(/\/$/, '');
      const response = await this.apiClient.put<ShowImage>(
        `${baseEndpoint}/${showId}/images/${imageId}`,
        input,
        { requiresAuth: true }
      );
      return {
        ...response,
        created_at: response.created_at ? new Date(response.created_at) : new Date(),
        updated_at: response.updated_at ? new Date(response.updated_at) : new Date(),
      };
    } catch (error) {
      console.error(`Error updating show image ${imageId}:`, error);
      throw error;
    }
  }

  async deleteShowImage(showId: string, imageId: string): Promise<void> {
    try {
      const baseEndpoint = this.endpoints.shows.replace(/\/$/, '');
      await this.apiClient.delete(
        `${baseEndpoint}/${showId}/images/${imageId}`,
        { requiresAuth: true }
      );
    } catch (error) {
      console.error(`Error deleting show image ${imageId}:`, error);
      throw error;
    }
  }
}

// Default export
export default ShowService;
