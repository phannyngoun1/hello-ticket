/**
 * Audit Module
 *
 * Exports audit service, provider, and types for use across the application.
 */

// Service
export { AuditService } from './audit-service';

// Provider and hooks
export {
  AuditProvider,
  useAuditService,
  useAuditLogs,
  type AuditProviderProps,
  type UseAuditLogsOptions,
  type UseAuditLogsResult,
} from './audit-provider';

// Types
export type {
  AuditLogParams,
  AuditLogEntry,
  AuditLogResponse,
  AuditLogFilters,
  AuditLogSorting,
  AuditServiceConfig,
} from './types';
