/**
 * Audit Logs Service
 *
 * Handles API calls to the audit logging backend endpoints.
 * Provides methods for fetching, filtering, and managing audit logs.
 */

import React from 'react';
import type { AuditLogEntry, AuditLogFilters } from './types';

/**
 * Parameters for audit log API requests
 */
export interface AuditLogParams {
  entity_type: string;
  entity_id: string;
  limit?: number;
  skip?: number;
  event_types?: string[];
  severities?: string[];
  user_email?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

/**
 * Response from audit log API
 */
export interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  has_next: boolean;
  skip: number;
  limit: number;
}

/**
 * Audit Logs Service Class
 */
export class AuditLogsService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
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
      // Note: The backend might not support severities filter yet
      // This is for future extension
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

    const url = `${this.baseUrl}/audit/user-activity?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers if needed
        // 'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audit logs: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Convert filters to API parameters
   */
  static filtersToParams(
    entityType: string,
    entityId: string,
    filters: AuditLogFilters,
    limit = 50,
    skip = 0
  ): AuditLogParams {
    return {
      entity_type: entityType,
      entity_id: entityId,
      limit,
      skip,
      event_types: filters.eventTypes,
      severities: filters.severities,
      user_email: filters.userEmail,
      date_from: filters.dateFrom,
      date_to: filters.dateTo,
      search: filters.search,
    };
  }
}

/**
 * React Hook for Audit Logs
 *
 * Provides state management and API integration for audit logs.
 */
export function useAuditLogs(
  entityType: string,
  entityId: string,
  initialFilters: AuditLogFilters = {},
  options: {
    autoLoad?: boolean;
    limit?: number;
  } = {}
) {
  const { autoLoad = true, limit = 50 } = options;

  const [logs, setLogs] = React.useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [skip, setSkip] = React.useState(0);

  const service = React.useMemo(() => new AuditLogsService(), []);

  const loadLogs = React.useCallback(async (
    filters: AuditLogFilters = initialFilters,
    reset = false
  ) => {
    try {
      setLoading(true);
      setError(null);

      const currentSkip = reset ? 0 : skip;
      const params = AuditLogsService.filtersToParams(
        entityType,
        entityId,
        filters,
        limit,
        currentSkip
      );

      const response = await service.getAuditLogs(params);

      setLogs(prev => reset ? response.items : [...prev, ...response.items]);
      setHasMore(response.has_next);
      setTotal(response.total);
      setSkip(currentSkip + response.items.length);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(errorMessage);
      console.error('Audit logs error:', err);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, initialFilters, limit, skip, service]);

  const loadMore = React.useCallback(() => {
    if (!loading && hasMore) {
      loadLogs(initialFilters, false);
    }
  }, [loading, hasMore, loadLogs, initialFilters]);

  const refresh = React.useCallback(() => {
    setSkip(0);
    loadLogs(initialFilters, true);
  }, [loadLogs, initialFilters]);

  // Auto-load on mount
  React.useEffect(() => {
    if (autoLoad) {
      loadLogs(initialFilters, true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    logs,
    loading,
    error,
    hasMore,
    total,
    loadLogs,
    loadMore,
    refresh,
  };
}
