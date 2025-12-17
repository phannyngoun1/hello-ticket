/**
 * Test Service
 *
 * Encapsulates all test API operations and data transformations.
 *
 * @author Phanny
 */

import type { Test, CreateTestInput, UpdateTestInput } from "./types";
import { ServiceConfig, PaginatedResponse, Pagination } from "@truths/shared";

interface TestDTO {
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
function transformTest(dto: TestDTO): Test {
  return {
    id: dto.id,
    
    
    code: dto.code,
    
    
    
    name: dto.name,
    
    
    created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
    updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
  };
}

interface TestEndpoints extends Record<string, string> {
  tests: string;
}

export type TestServiceConfig = ServiceConfig<TestEndpoints>;

export class TestService {
  private apiClient: TestServiceConfig['apiClient'];
  private endpoints: TestServiceConfig['endpoints'];

  constructor(config: TestServiceConfig) {
    this.apiClient = config.apiClient;
    this.endpoints = config.endpoints;
  }

  async fetchTests(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Test>> {
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

      const baseEndpoint = this.endpoints.tests.replace(/\/$/, '');
      const url = queryParams.toString()
        ? `${baseEndpoint}?${queryParams.toString()}`
        : baseEndpoint;

      const response = await this.apiClient.get<{
        items: TestDTO[];
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
        data: (response.items || []).map(transformTest),
        pagination,
      };
    } catch (error) {
      console.error('Error fetching Test:', error);
      throw error;
    }
  }

  async searchTests(query: string, limit: number = 100): Promise<Test[]> {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        return [];
      }

      const queryParams = new URLSearchParams();
      queryParams.append('search', trimmedQuery);
      queryParams.append('limit', Math.min(limit, 200).toString());

      const baseEndpoint = this.endpoints.tests.replace(/\/$/, '');
      const url = `${baseEndpoint}?${queryParams.toString()}`;

      const response = await this.apiClient.get<{
        items: TestDTO[];
        skip: number;
        limit: number;
        total: number;
        has_next: boolean;
      }>(
        url,
        { requiresAuth: true }
      );

      return (response.items || []).map(transformTest);
    } catch (error) {
      console.error('Error searching Test:', error);
      throw error;
    }
  }

  async fetchTestById(id: string): Promise<Test> {
    try {
      const baseEndpoint = this.endpoints.tests.replace(/\/$/, '');
      const response = await this.apiClient.get<TestDTO>(
        `${baseEndpoint}/${id}`,
        { requiresAuth: true }
      );
      return transformTest(response);
    } catch (error) {
      console.error(`Error fetching Test ${id}:`, error);
      throw error;
    }
  }

  async createTest(input: CreateTestInput): Promise<Test> {
    try {
      const response = await this.apiClient.post<TestDTO>(
        this.endpoints.tests,
        input,
        { requiresAuth: true }
      );
      return transformTest(response);
    } catch (error) {
      console.error('Error creating Test:', error);
      throw error;
    }
  }

  async updateTest(id: string, input: UpdateTestInput): Promise<Test> {
    try {
      const baseEndpoint = this.endpoints.tests.replace(/\/$/, '');
      const response = await this.apiClient.put<TestDTO>(
        `${baseEndpoint}/${id}`,
        input,
        { requiresAuth: true }
      );
      return transformTest(response);
    } catch (error) {
      console.error(`Error updating Test ${id}:`, error);
      throw error;
    }
  }

  async deleteTest(id: string): Promise<void> {
    try {
      const baseEndpoint = this.endpoints.tests.replace(/\/$/, '');
      await this.apiClient.delete(
        `${baseEndpoint}/${id}`,
        { requiresAuth: true }
      );
    } catch (error) {
      console.error(`Error deleting Test ${id}:`, error);
      throw error;
    }
  }
}

// Default export
export default TestService;
