/**
 * Company Address Service
 *
 * Encapsulates all company address API operations.
 * Located in shared package since company addresses are a general company feature,
 * not specific to any particular module.
 *
 * @author Phanny
 */

import {
  CompanyAddress,
  CreateCompanyAddressInput,
  UpdateCompanyAddressInput,
} from "../domain/types";
import { ServiceConfig, PaginatedResponse } from "../api/types";

interface CompanyAddressDTO {
  id: string;
  tenant_id?: string;
  name: string;
  address_type: "default" | "billing" | "shipping";
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  is_default: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

function transformCompanyAddress(dto: CompanyAddressDTO): CompanyAddress {
  return {
    id: dto.id,
    ...(dto.tenant_id !== undefined && { tenant_id: dto.tenant_id }),
    name: dto.name,
    address_type: dto.address_type,
    street: dto.street ?? null,
    city: dto.city ?? null,
    state: dto.state ?? null,
    postal_code: dto.postal_code ?? null,
    country: dto.country ?? null,
    is_default: dto.is_default,
    notes: dto.notes ?? null,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
  };
}

interface CompanyAddressEndpoints extends Record<string, string> {
  "company-addresses": string;
}

export type CompanyAddressServiceConfig = ServiceConfig<CompanyAddressEndpoints>;

export class CompanyAddressService {
  private config: CompanyAddressServiceConfig;

  constructor(config: CompanyAddressServiceConfig) {
    this.config = config;
  }

  private getEndpoint() {
    return this.config.endpoints?.["company-addresses"] || "/api/v1/company-addresses";
  }

  async fetchCompanyAddresses(params?: {
    skip?: number;
    limit?: number;
    address_type?: "default" | "billing" | "shipping";
    [key: string]: unknown;
  }): Promise<PaginatedResponse<CompanyAddress>> {
    const { apiClient } = this.config;
    const endpoint = this.getEndpoint();

    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append("skip", params.skip.toString());
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.address_type) queryParams.append("address_type", params.address_type);

    const url = queryParams.toString() ? `${endpoint}?${queryParams.toString()}` : endpoint;
    const data = await apiClient.get<{
      items?: CompanyAddressDTO[];
      skip?: number;
      limit?: number;
      has_next?: boolean;
    }>(url, {
      requiresAuth: true,
    });

    return {
      data: (data.items ?? []).map(transformCompanyAddress),
      pagination: {
        page: Math.floor((params?.skip || 0) / (params?.limit || 50)) + 1,
        pageSize: params?.limit ?? 50,
        total: data.items?.length ?? 0,
        totalPages: data.has_next
          ? Math.ceil((data.items?.length ?? 0) / (params?.limit || 50)) + 1
          : Math.ceil((data.items?.length ?? 0) / (params?.limit || 50)),
      },
    };
  }

  async fetchCompanyAddress(id: string): Promise<CompanyAddress> {
    const { apiClient } = this.config;
    const endpoint = this.getEndpoint();
    const data = await apiClient.get<CompanyAddressDTO>(`${endpoint}/${id}`, {
      requiresAuth: true,
    });
    return transformCompanyAddress(data);
  }

  async createCompanyAddress(input: CreateCompanyAddressInput): Promise<CompanyAddress> {
    const { apiClient } = this.config;
    const endpoint = this.getEndpoint();
    const data = await apiClient.post<CompanyAddressDTO>(endpoint, input, {
      requiresAuth: true,
    });
    return transformCompanyAddress(data);
  }

  async updateCompanyAddress(id: string, input: UpdateCompanyAddressInput): Promise<CompanyAddress> {
    const { apiClient } = this.config;
    const endpoint = this.getEndpoint();
    const data = await apiClient.put<CompanyAddressDTO>(`${endpoint}/${id}`, input, {
      requiresAuth: true,
    });
    return transformCompanyAddress(data);
  }

  async deleteCompanyAddress(id: string): Promise<void> {
    const { apiClient } = this.config;
    const endpoint = this.getEndpoint();
    await apiClient.delete(`${endpoint}/${id}`, {
      requiresAuth: true,
    });
  }
}

export type CompanyAddressEndpointsMap = CompanyAddressEndpoints;

