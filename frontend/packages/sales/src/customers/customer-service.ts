/**
 * Customer Service
 *
 * Encapsulates all customer API operations and data transformations.
 *
 * @author Phanny
 */

import { Customer, CreateCustomerInput, UpdateCustomerInput } from "../types";
import { ServiceConfig, PaginatedResponse } from "@truths/shared";

interface CustomerDTO {
  id: string;
  code: string;
  name: string;
  created_at: string;
  updated_at?: string;
}

function transformCustomer(dto: CustomerDTO): Customer {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    status: 'active',
    business_name: '',
    createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
    updatedAt: dto.updated_at ? new Date(dto.updated_at) : undefined,
  };
}

function transformToBackend(input: CreateCustomerInput | UpdateCustomerInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if ("code" in input && input.code !== undefined) {
    payload.code = input.code;
  }
  if ("name" in input && input.name !== undefined) {
    payload.name = input.name;
  }
  return payload;
}

interface CustomerEndpoints extends Record<string, string> {
  "customers": string;
}

export type CustomerServiceConfig = ServiceConfig<CustomerEndpoints>;

export class CustomerService {
  private config: CustomerServiceConfig;

  constructor(config: CustomerServiceConfig) {
    this.config = config;
  }

  private getEndpoint() {
    return this.config.endpoints?.["customers"] || "/api/v1/sales/customers";
  }

  async fetchCustomers(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    [key: string]: unknown;
  }): Promise<PaginatedResponse<Customer>> {
    const { apiClient } = this.config;
    const endpoint = this.getEndpoint();

    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append("skip", params.skip.toString());
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const url = queryParams.toString() ? `${endpoint}?${queryParams.toString()}` : endpoint;
    const data = await apiClient.get<{ items?: CustomerDTO[]; total?: number; total_pages?: number; page?: number; page_size?: number }>(url, {
      requiresAuth: true,
    });

    return {
      data: (data.items ?? []).map(transformCustomer),
      pagination: {
        page: data.page ?? Math.floor((params?.skip || 0) / (params?.limit || 50)) + 1,
        pageSize: data.page_size ?? params?.limit ?? 50,
        total: data.total ?? 0,
        totalPages: data.total_pages ?? 0,
      },
    };
  }

  async fetchCustomer(id: string): Promise<Customer> {
    const { apiClient } = this.config;
    const endpoint = this.getEndpoint();
    const data = await apiClient.get<CustomerDTO>(`${endpoint}/${id}`, {
      requiresAuth: true,
    });
    return transformCustomer(data);
  }

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const { apiClient } = this.config;
    const endpoint = this.getEndpoint();
    const payload = transformToBackend(input);
    const data = await apiClient.post<CustomerDTO>(endpoint, payload, {
      requiresAuth: true,
    });
    return transformCustomer(data);
  }

  async updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
    const { apiClient } = this.config;
    const endpoint = this.getEndpoint();
    const payload = transformToBackend(input);
    const data = await apiClient.put<CustomerDTO>(`${endpoint}/${id}`, payload, {
      requiresAuth: true,
    });
    return transformCustomer(data);
  }

  async deleteCustomer(id: string): Promise<void> {
    const { apiClient } = this.config;
    const endpoint = this.getEndpoint();
    await apiClient.delete(`${endpoint}/${id}`, {
      requiresAuth: true,
    });
  }

}

export type CustomerEndpointsMap = CustomerEndpoints;
