/**
 * Customer Service
 *
 * Encapsulates all customer API operations and data transformations.
 *
 * @author Phanny
 */

import { Customer, CreateCustomerInput, UpdateCustomerInput } from "../types";
import { ServiceConfig, PaginatedResponse } from "@truths/shared";
import { API_CONFIG } from "@truths/config";

interface CustomerDTO {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  business_name?: string | null;
  street_address?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  id_number?: string | null;
  id_type?: string | null;
  account_manager_id?: string | null;
  sales_representative_id?: string | null;
  customer_since?: string | null;
  last_purchase_date?: string | null;
  total_purchase_amount?: number | null;
  last_contact_date?: string | null;
  event_preferences?: string | null;
  seating_preferences?: string | null;
  accessibility_needs?: string | null;
  dietary_restrictions?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  preferred_language?: string | null;
  marketing_opt_in?: boolean | null;
  email_marketing?: boolean | null;
  sms_marketing?: boolean | null;
  facebook_url?: string | null;
  twitter_handle?: string | null;
  linkedin_url?: string | null;
  instagram_handle?: string | null;
  website?: string | null;
  tags?: string[] | null;
  status_reason?: string | null;
  notes?: string | null;
  public_notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
  deactivated_at?: string | null;
}

function transformCustomer(dto: CustomerDTO): Customer {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    status: dto.is_active ? 'active' : 'inactive',
    email: dto.email ?? undefined,
    phone: dto.phone ?? undefined,
    business_name: dto.business_name ?? undefined,
    street_address: dto.street_address ?? undefined,
    city: dto.city ?? undefined,
    state_province: dto.state_province ?? undefined,
    postal_code: dto.postal_code ?? undefined,
    country: dto.country ?? undefined,
    date_of_birth: dto.date_of_birth ?? undefined,
    gender: dto.gender ?? undefined,
    nationality: dto.nationality ?? undefined,
    id_number: dto.id_number ?? undefined,
    id_type: dto.id_type ?? undefined,
    account_manager_id: dto.account_manager_id ?? undefined,
    sales_representative_id: dto.sales_representative_id ?? undefined,
    customer_since: dto.customer_since ?? undefined,
    last_purchase_date: dto.last_purchase_date ?? undefined,
    total_purchase_amount: dto.total_purchase_amount ?? undefined,
    last_contact_date: dto.last_contact_date ?? undefined,
    event_preferences: dto.event_preferences ?? undefined,
    seating_preferences: dto.seating_preferences ?? undefined,
    accessibility_needs: dto.accessibility_needs ?? undefined,
    dietary_restrictions: dto.dietary_restrictions ?? undefined,
    emergency_contact_name: dto.emergency_contact_name ?? undefined,
    emergency_contact_phone: dto.emergency_contact_phone ?? undefined,
    emergency_contact_relationship: dto.emergency_contact_relationship ?? undefined,
    preferred_language: dto.preferred_language ?? undefined,
    marketing_opt_in: dto.marketing_opt_in ?? undefined,
    email_marketing: dto.email_marketing ?? undefined,
    sms_marketing: dto.sms_marketing ?? undefined,
    facebook_url: dto.facebook_url ?? undefined,
    twitter_handle: dto.twitter_handle ?? undefined,
    linkedin_url: dto.linkedin_url ?? undefined,
    instagram_handle: dto.instagram_handle ?? undefined,
    website: dto.website ?? undefined,
    tags: dto.tags ?? undefined,
    status_reason: dto.status_reason ?? undefined,
    notes: dto.notes ?? undefined,
    public_notes: dto.public_notes ?? undefined,
    createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
    updatedAt: dto.updated_at ? new Date(dto.updated_at) : undefined,
    deactivatedAt: dto.deactivated_at ? new Date(dto.deactivated_at) : undefined,
  };
}

function transformToBackend(input: CreateCustomerInput | UpdateCustomerInput): Record<string, unknown> {
  // Guard against invalid input
  if (!input || typeof input !== "object") {
    console.error("transformToBackend received invalid input:", input);
    return {};
  }

  const payload: Record<string, unknown> = {};

  // Essential fields
  if ("code" in input && input.code !== undefined && input.code !== null) {
    payload.code = input.code;
  }
  if ("name" in input && input.name !== undefined && input.name !== null) {
    payload.name = input.name;
  }
  if ("status" in input && input.status !== undefined && input.status !== null) {
    payload.status = input.status;
  }

  // Contact information
  if ("email" in input && input.email !== undefined && input.email !== null) {
    payload.email = input.email;
  }
  if ("phone" in input && input.phone !== undefined && input.phone !== null) {
    payload.phone = input.phone;
  }
  if ("business_name" in input && input.business_name !== undefined && input.business_name !== null) {
    payload.business_name = input.business_name;
  }

  // Address
  if ("street_address" in input && input.street_address !== undefined && input.street_address !== null) {
    payload.street_address = input.street_address;
  }
  if ("city" in input && input.city !== undefined && input.city !== null) {
    payload.city = input.city;
  }
  if ("state_province" in input && input.state_province !== undefined && input.state_province !== null) {
    payload.state_province = input.state_province;
  }
  if ("postal_code" in input && input.postal_code !== undefined && input.postal_code !== null) {
    payload.postal_code = input.postal_code;
  }
  if ("country" in input && input.country !== undefined && input.country !== null) {
    payload.country = input.country;
  }

  // Profile
  if ("date_of_birth" in input && input.date_of_birth !== undefined && input.date_of_birth !== null) {
    payload.date_of_birth = input.date_of_birth;
  }
  if ("gender" in input && input.gender !== undefined && input.gender !== null) {
    payload.gender = input.gender;
  }
  if ("nationality" in input && input.nationality !== undefined && input.nationality !== null) {
    payload.nationality = input.nationality;
  }
  if ("id_number" in input && input.id_number !== undefined && input.id_number !== null) {
    payload.id_number = input.id_number;
  }
  if ("id_type" in input && input.id_type !== undefined && input.id_type !== null) {
    payload.id_type = input.id_type;
  }

  // Account Management
  if ("account_manager_id" in input && input.account_manager_id !== undefined && input.account_manager_id !== null) {
    payload.account_manager_id = input.account_manager_id;
  }
  if ("sales_representative_id" in input && input.sales_representative_id !== undefined && input.sales_representative_id !== null) {
    payload.sales_representative_id = input.sales_representative_id;
  }
  if ("customer_since" in input && input.customer_since !== undefined && input.customer_since !== null) {
    payload.customer_since = input.customer_since;
  }
  if ("last_purchase_date" in input && input.last_purchase_date !== undefined && input.last_purchase_date !== null) {
    payload.last_purchase_date = input.last_purchase_date;
  }
  if ("total_purchase_amount" in input && input.total_purchase_amount !== undefined && input.total_purchase_amount !== null) {
    payload.total_purchase_amount = input.total_purchase_amount;
  }
  if ("last_contact_date" in input && input.last_contact_date !== undefined && input.last_contact_date !== null) {
    payload.last_contact_date = input.last_contact_date;
  }

  // Preferences
  if ("event_preferences" in input && input.event_preferences !== undefined && input.event_preferences !== null) {
    payload.event_preferences = input.event_preferences;
  }
  if ("seating_preferences" in input && input.seating_preferences !== undefined && input.seating_preferences !== null) {
    payload.seating_preferences = input.seating_preferences;
  }
  if ("accessibility_needs" in input && input.accessibility_needs !== undefined && input.accessibility_needs !== null) {
    payload.accessibility_needs = input.accessibility_needs;
  }
  if ("dietary_restrictions" in input && input.dietary_restrictions !== undefined && input.dietary_restrictions !== null) {
    payload.dietary_restrictions = input.dietary_restrictions;
  }
  if ("emergency_contact_name" in input && input.emergency_contact_name !== undefined && input.emergency_contact_name !== null) {
    payload.emergency_contact_name = input.emergency_contact_name;
  }
  if ("emergency_contact_phone" in input && input.emergency_contact_phone !== undefined && input.emergency_contact_phone !== null) {
    payload.emergency_contact_phone = input.emergency_contact_phone;
  }
  if ("emergency_contact_relationship" in input && input.emergency_contact_relationship !== undefined && input.emergency_contact_relationship !== null) {
    payload.emergency_contact_relationship = input.emergency_contact_relationship;
  }
  if ("preferred_language" in input && input.preferred_language !== undefined && input.preferred_language !== null) {
    payload.preferred_language = input.preferred_language;
  }
  if ("marketing_opt_in" in input && input.marketing_opt_in !== undefined && input.marketing_opt_in !== null) {
    payload.marketing_opt_in = input.marketing_opt_in;
  }
  if ("email_marketing" in input && input.email_marketing !== undefined && input.email_marketing !== null) {
    payload.email_marketing = input.email_marketing;
  }
  if ("sms_marketing" in input && input.sms_marketing !== undefined && input.sms_marketing !== null) {
    payload.sms_marketing = input.sms_marketing;
  }

  // Social & Online
  if ("facebook_url" in input && input.facebook_url !== undefined && input.facebook_url !== null) {
    payload.facebook_url = input.facebook_url;
  }
  if ("twitter_handle" in input && input.twitter_handle !== undefined && input.twitter_handle !== null) {
    payload.twitter_handle = input.twitter_handle;
  }
  if ("linkedin_url" in input && input.linkedin_url !== undefined && input.linkedin_url !== null) {
    payload.linkedin_url = input.linkedin_url;
  }
  if ("instagram_handle" in input && input.instagram_handle !== undefined && input.instagram_handle !== null) {
    payload.instagram_handle = input.instagram_handle;
  }
  if ("website" in input && input.website !== undefined && input.website !== null) {
    payload.website = input.website;
  }

  // Tags & Classification
  // Tags are now managed via tag service - only tag_ids are accepted
  if ("tag_ids" in input && input.tag_ids !== undefined && input.tag_ids !== null) {
    payload.tag_ids = input.tag_ids;
  }
  if ("status_reason" in input && input.status_reason !== undefined && input.status_reason !== null) {
    payload.status_reason = input.status_reason;
  }
  if ("notes" in input && input.notes !== undefined && input.notes !== null) {
    payload.notes = input.notes;
  }
  if ("public_notes" in input && input.public_notes !== undefined && input.public_notes !== null) {
    payload.public_notes = input.public_notes;
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
    return this.config.endpoints?.["customers"] || API_CONFIG.ENDPOINTS.SALES.CUSTOMERS;
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
