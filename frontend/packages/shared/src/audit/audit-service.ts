/**
 * Audit Service
 *
 * Handles API calls to the audit logging backend endpoints.
 * Provides methods for fetching, filtering, and managing audit logs.
 */

import type {
  AuditLogParams,
  AuditLogResponse,
  AuditLogFilters,
  AuditServiceConfig,
} from './types';

/**
 * Audit Logs Service Class
 *
 * Encapsulates all audit log API operations and data transformations.
 */
export class AuditService {
  private apiClient: AuditServiceConfig['apiClient'];
  private baseUrl: string;

  constructor(config: AuditServiceConfig) {
    this.apiClient = config.apiClient;
    this.baseUrl = config.baseUrl || '/api/v1';
  }

  /**
   * Fetch audit logs from the API
   */
  async getAuditLogs(params: AuditLogParams): Promise<AuditLogResponse> {
    const queryParams = new URLSearchParams();

    // Required parameters
    queryParams.set('entity_type', params.entity_type);
    queryParams.set('entity_id', params.entity_id);

    // Optional parameters
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.skip) queryParams.set('skip', params.skip.toString());

    if (params.event_types?.length) {
      queryParams.set('event_types', params.event_types.join(','));
    }

    if (params.severities?.length) {
      queryParams.set('severities', params.severities.join(','));
    }

    if (params.user_email) {
      queryParams.set('user_email', params.user_email);
    }

    if (params.date_from) {
      queryParams.set('start_date', params.date_from);
    }

    if (params.date_to) {
      queryParams.set('end_date', params.date_to);
    }

    if (params.search) {
      queryParams.set('search', params.search);
    }

    if (params.sort_by) {
      queryParams.set('sort_by', params.sort_by);
    }

    if (params.sort_order) {
      queryParams.set('sort_order', params.sort_order);
    }

    const url = `${this.baseUrl}/audit/user-activity?${queryParams.toString()}`;

    const response = await this.apiClient.get<AuditLogResponse>(url, {
      requiresAuth: true,
    });

    return response;
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditLogs(
    entityType: string,
    entityId: string,
    options: {
      limit?: number;
      skip?: number;
      filters?: AuditLogFilters;
      sortBy?: string;
      sortOrder?: string;
    } = {}
  ): Promise<AuditLogResponse> {
    const params = this.filtersToParams(
      entityType,
      entityId,
      options.filters || {},
      options.limit || 50,
      options.skip || 0,
      options.sortBy,
      options.sortOrder
    );

    return this.getAuditLogs(params);
  }

  /**
   * Convert filters to API parameters
   */
  filtersToParams(
    entityType: string,
    entityId: string,
    filters: AuditLogFilters,
    limit = 50,
    skip = 0,
    sortBy?: string,
    sortOrder?: string
  ): AuditLogParams {
    const params: AuditLogParams = {
      entity_type: entityType,
      entity_id: entityId,
      limit,
      skip,
    };
    if (filters.eventTypes !== undefined) params.event_types = filters.eventTypes;
    if (filters.severities !== undefined) params.severities = filters.severities;
    if (filters.userEmail !== undefined) params.user_email = filters.userEmail;
    if (filters.dateFrom !== undefined) params.date_from = filters.dateFrom;
    if (filters.dateTo !== undefined) params.date_to = filters.dateTo;
    if (filters.search !== undefined) params.search = filters.search;
    if (sortBy !== undefined) params.sort_by = sortBy;
    if (sortOrder !== undefined) params.sort_order = sortOrder;
    return params;
  }
}
