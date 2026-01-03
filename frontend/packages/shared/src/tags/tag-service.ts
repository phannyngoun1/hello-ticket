/**
 * Tag Service
 *
 * Service for managing tags - creating, searching, and linking to entities
 *
 * @author Phanny
 */

import { api } from "@truths/api";
import { ServiceConfig } from "../api/types";

export interface Tag {
  id: string;
  tenant_id: string;
  name: string;
  entity_type: string;
  description?: string | null;
  color?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TagListResponse {
  items: Tag[];
  total: number;
  has_next: boolean;
}

export interface GetOrCreateTagsRequest {
  tag_names: string[];
  entity_type: string;
}

export interface GetOrCreateTagsResponse {
  tag_ids: string[];
}

export interface SetEntityTagsRequest {
  tag_ids: string[];
}

export interface TagWithAttachmentStatus extends Tag {
  is_attached: boolean;
}

export interface GetAvailableTagsResponse {
  items: TagWithAttachmentStatus[];
  total: number;
}

export interface ManageEntityTagsRequest {
  tag_names: string[];
}

export interface ManageEntityTagsResponse {
  tags: Tag[];
  created_count: number;
}

const BASE_ENDPOINT = "/api/v1/shared/tags";

export class TagService {
  private config: ServiceConfig;

  constructor(config: ServiceConfig) {
    this.config = config;
  }

  /**
   * Get or create tags by name
   * This is the main method to use when you have tag names and need tag IDs
   */
  async getOrCreateTags(
    tagNames: string[],
    entityType: string
  ): Promise<string[]> {
    const request: GetOrCreateTagsRequest = {
      tag_names: tagNames.filter((name) => name && name.trim()),
      entity_type: entityType,
    };
    const response = await this.config.apiClient.post<GetOrCreateTagsResponse>(
      `${BASE_ENDPOINT}/get-or-create`,
      request,
      { requiresAuth: true }
    );
    return response.tag_ids;
  }

  /**
   * Search tags
   */
  async searchTags(params: {
    entity_type?: string;
    search?: string;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<TagListResponse> {
    const queryParams = new URLSearchParams();
    if (params.entity_type) queryParams.append("entity_type", params.entity_type);
    if (params.search) queryParams.append("search", params.search);
    if (params.is_active !== undefined)
      queryParams.append("is_active", String(params.is_active));
    if (params.skip !== undefined) queryParams.append("skip", String(params.skip));
    if (params.limit !== undefined) queryParams.append("limit", String(params.limit));

    const endpoint = `${BASE_ENDPOINT}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return this.config.apiClient.get<TagListResponse>(endpoint, {
      requiresAuth: true,
    });
  }

  /**
   * Get tags for an entity
   */
  async getEntityTags(entityType: string, entityId: string): Promise<Tag[]> {
    return this.config.apiClient.get<Tag[]>(
      `${BASE_ENDPOINT}/entity/${entityType}/${entityId}`,
      { requiresAuth: true }
    );
  }

  /**
   * Set tags for an entity
   */
  async setEntityTags(
    entityType: string,
    entityId: string,
    tagIds: string[]
  ): Promise<Tag[]> {
    const request: SetEntityTagsRequest = { tag_ids: tagIds };
    return this.config.apiClient.post<Tag[]>(
      `${BASE_ENDPOINT}/entity/${entityType}/${entityId}/tags`,
      request,
      { requiresAuth: true }
    );
  }

  /**
   * Create a new tag
   */
  async createTag(input: {
    name: string;
    entity_type: string;
    description?: string;
    color?: string;
  }): Promise<Tag> {
    return this.config.apiClient.post<Tag>(BASE_ENDPOINT, input, {
      requiresAuth: true,
    });
  }

  /**
   * Get a tag by ID
   */
  async getTagById(tagId: string): Promise<Tag> {
    return this.config.apiClient.get<Tag>(`${BASE_ENDPOINT}/${tagId}`, {
      requiresAuth: true,
    });
  }

  /**
   * Update a tag
   */
  async updateTag(
    tagId: string,
    input: {
      name?: string;
      entity_type?: string;
      description?: string;
      color?: string;
    }
  ): Promise<Tag> {
    return this.config.apiClient.put<Tag>(`${BASE_ENDPOINT}/${tagId}`, input, {
      requiresAuth: true,
    });
  }

  /**
   * Delete a tag
   */
  async deleteTag(tagId: string): Promise<void> {
    return this.config.apiClient.delete(`${BASE_ENDPOINT}/${tagId}`, {
      requiresAuth: true,
    });
  }

  /**
   * Get available tags for an entity with attachment status
   */
  async getAvailableTagsForEntity(
    entityType: string,
    entityId: string,
    search?: string,
    limit?: number
  ): Promise<GetAvailableTagsResponse> {
    const queryParams = new URLSearchParams();
    if (search) queryParams.append("search", search);
    if (limit) queryParams.append("limit", String(limit));

    const url = `${BASE_ENDPOINT}/entity/${entityType}/${entityId}/available${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return this.config.apiClient.get<GetAvailableTagsResponse>(url, {
      requiresAuth: true,
    });
  }

  /**
   * Manage entity tags - creates new tags and attaches them in one operation
   * This is the unified method that handles everything
   */
  async manageEntityTags(
    entityType: string,
    entityId: string,
    tagNames: string[]
  ): Promise<ManageEntityTagsResponse> {
    const request: ManageEntityTagsRequest = {
      tag_names: tagNames.filter((name) => name && name.trim()),
    };
    return this.config.apiClient.post<ManageEntityTagsResponse>(
      `${BASE_ENDPOINT}/entity/${entityType}/${entityId}/manage`,
      request,
      { requiresAuth: true }
    );
  }
}

