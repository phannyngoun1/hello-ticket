/**
 * Audit Provider
 *
 * Provides configured AuditService to all child components.
 * Makes the service available via useAuditService hook.
 */

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { AuditService } from './audit-service';
import type {
  AuditServiceConfig,
  AuditLogEntry,
  AuditLogFilters,
  AuditLogResponse,
} from './types';

/**
 * Context value for audit service
 */
interface AuditContextValue {
  service: AuditService;
}

const AuditContext = createContext<AuditContextValue | null>(null);

/**
 * Props for AuditProvider component
 */
export interface AuditProviderProps {
  children: ReactNode;
  config: AuditServiceConfig;
}

/**
 * AuditProvider component
 *
 * Wraps children with audit service context.
 */
export function AuditProvider({ children, config }: AuditProviderProps) {
  const service = useMemo(
    () => new AuditService(config),
    [config.apiClient, config.baseUrl]
  );

  const value = useMemo<AuditContextValue>(() => ({ service }), [service]);

  return (
    <AuditContext.Provider value={value}>{children}</AuditContext.Provider>
  );
}

/**
 * Hook to access the audit service
 *
 * @throws Error if used outside of AuditProvider
 */
export function useAuditService(): AuditService {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAuditService must be used within AuditProvider');
  }
  return context.service;
}

/**
 * Options for useAuditLogs hook
 */
export interface UseAuditLogsOptions {
  /** Whether to automatically load logs on mount */
  autoLoad?: boolean;
  /** Number of logs to fetch per page */
  limit?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: string;
}

/**
 * Return type for useAuditLogs hook
 */
export interface UseAuditLogsResult {
  /** Array of audit log entries */
  logs: AuditLogEntry[];
  /** Whether logs are currently loading */
  loading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Whether more logs are available */
  hasMore: boolean;
  /** Total number of logs */
  total: number;
  /** Function to load logs with filters */
  loadLogs: (filters?: AuditLogFilters, reset?: boolean) => Promise<void>;
  /** Function to load more logs */
  loadMore: () => void;
  /** Function to refresh logs */
  refresh: () => void;
}

/**
 * Hook for managing audit logs state and API calls
 *
 * @param entityType - Type of entity to fetch logs for
 * @param entityId - ID of the entity
 * @param initialFilters - Initial filter values
 * @param options - Additional options
 */
export function useAuditLogs(
  entityType: string,
  entityId: string,
  initialFilters: AuditLogFilters = {},
  options: UseAuditLogsOptions = {}
): UseAuditLogsResult {
  const { autoLoad = true, limit = 50 } = options;

  // Get service from context
  const service = useAuditService();

  // Store options in refs to avoid recreation issues
  const sortByRef = useRef(options.sortBy);
  const sortOrderRef = useRef(options.sortOrder);
  const entityTypeRef = useRef(entityType);
  const entityIdRef = useRef(entityId);
  const limitRef = useRef(limit);
  const initialFiltersRef = useRef(initialFilters);

  // Update refs when props change
  sortByRef.current = options.sortBy;
  sortOrderRef.current = options.sortOrder;
  entityTypeRef.current = entityType;
  entityIdRef.current = entityId;
  limitRef.current = limit;
  initialFiltersRef.current = initialFilters;

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const skipRef = useRef(0);

  // Track if initial load has happened
  const hasLoadedRef = useRef(false);
  const loadingRef = useRef(false);

  const loadLogs = useCallback(
    async (filters: AuditLogFilters = initialFiltersRef.current, reset = false) => {
      // Prevent concurrent requests
      if (loadingRef.current) return;

      try {
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        const currentSkip = reset ? 0 : skipRef.current;

        const response: AuditLogResponse = await service.getEntityAuditLogs(
          entityTypeRef.current,
          entityIdRef.current,
          {
            limit: limitRef.current,
            skip: currentSkip,
            filters,
            sortBy: sortByRef.current,
            sortOrder: sortOrderRef.current,
          }
        );

        setLogs((prev) => (reset ? response.items : [...prev, ...response.items]));
        setHasMore(response.has_next);
        setTotal(response.total);
        skipRef.current = currentSkip + response.items.length;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load audit logs';
        setError(errorMessage);
        console.error('Audit logs error:', err);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [service]
  );

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) {
      loadLogs(initialFiltersRef.current, false);
    }
  }, [hasMore, loadLogs]);

  const refresh = useCallback(() => {
    skipRef.current = 0;
    loadLogs(initialFiltersRef.current, true);
  }, [loadLogs]);

  // Auto-load on mount only (single load)
  useEffect(() => {
    if (autoLoad && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadLogs(initialFiltersRef.current, true);
    }
  }, [autoLoad, loadLogs]);

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
