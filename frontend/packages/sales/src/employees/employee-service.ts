/**
 * Employee Service
 *
 * Encapsulates all employee API operations and data transformations.
 */

import type { Employee, CreateEmployeeInput, UpdateEmployeeInput } from "./types";
import { ServiceConfig, PaginatedResponse, Pagination } from "@truths/shared";

interface EmployeeDTO {
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
function transformEmployee(dto: EmployeeDTO): Employee {
  return {
    id: dto.id,
    
    
    code: dto.code,
    
    
    
    name: dto.name,
    
    
    created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
    updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
  };
}

interface EmployeeEndpoints extends Record<string, string> {
  employees: string;
}

export type EmployeeServiceConfig = ServiceConfig<EmployeeEndpoints>;

export class EmployeeService {
  private apiClient: EmployeeServiceConfig['apiClient'];
  private endpoints: EmployeeServiceConfig['endpoints'];

  constructor(config: EmployeeServiceConfig) {
    this.apiClient = config.apiClient;
    this.endpoints = config.endpoints;
  }

  async fetchEmployees(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Employee>> {
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

      const baseEndpoint = this.endpoints.employees.replace(/\/$/, '');
      const url = queryParams.toString()
        ? `${baseEndpoint}?${queryParams.toString()}`
        : baseEndpoint;

      const response = await this.apiClient.get<{
        items: EmployeeDTO[];
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
        data: (response.items || []).map(transformEmployee),
        pagination,
      };
    } catch (error) {
      console.error('Error fetching Employee:', error);
      throw error;
    }
  }

  async searchEmployees(query: string, limit: number = 100): Promise<Employee[]> {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        return [];
      }

      const queryParams = new URLSearchParams();
      queryParams.append('search', trimmedQuery);
      queryParams.append('limit', Math.min(limit, 200).toString());

      const baseEndpoint = this.endpoints.employees.replace(/\/$/, '');
      const url = `${baseEndpoint}?${queryParams.toString()}`;

      const response = await this.apiClient.get<{
        items: EmployeeDTO[];
        skip: number;
        limit: number;
        total: number;
        has_next: boolean;
      }>(
        url,
        { requiresAuth: true }
      );

      return (response.items || []).map(transformEmployee);
    } catch (error) {
      console.error('Error searching Employee:', error);
      throw error;
    }
  }

  async fetchEmployeeById(id: string): Promise<Employee> {
    try {
      const baseEndpoint = this.endpoints.employees.replace(/\/$/, '');
      const response = await this.apiClient.get<EmployeeDTO>(
        `${baseEndpoint}/${id}`,
        { requiresAuth: true }
      );
      return transformEmployee(response);
    } catch (error) {
      console.error(`Error fetching Employee ${id}:`, error);
      throw error;
    }
  }

  async createEmployee(input: CreateEmployeeInput): Promise<Employee> {
    try {
      const response = await this.apiClient.post<EmployeeDTO>(
        this.endpoints.employees,
        input,
        { requiresAuth: true }
      );
      return transformEmployee(response);
    } catch (error) {
      console.error('Error creating Employee:', error);
      throw error;
    }
  }

  async updateEmployee(id: string, input: UpdateEmployeeInput): Promise<Employee> {
    try {
      const baseEndpoint = this.endpoints.employees.replace(/\/$/, '');
      const response = await this.apiClient.put<EmployeeDTO>(
        `${baseEndpoint}/${id}`,
        input,
        { requiresAuth: true }
      );
      return transformEmployee(response);
    } catch (error) {
      console.error(`Error updating Employee ${id}:`, error);
      throw error;
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    try {
      const baseEndpoint = this.endpoints.employees.replace(/\/$/, '');
      await this.apiClient.delete(
        `${baseEndpoint}/${id}`,
        { requiresAuth: true }
      );
    } catch (error) {
      console.error(`Error deleting Employee ${id}:`, error);
      throw error;
    }
  }
}

// Default export
export default EmployeeService;
