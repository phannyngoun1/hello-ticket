/**
 * Audit Logs Component Types
 *
 * Re-exports shared types and defines component-specific interfaces.
 */

// Re-export shared types for convenience
export type {
  AuditLogEntry,
  AuditLogFilters,
  AuditLogSorting,
} from "@truths/shared";

import type { AuditLogEntry, AuditLogFilters, AuditLogSorting } from "@truths/shared";

export interface AuditLogsProps {
  /** The entity type to filter logs by (e.g., "event", "user", "booking") */
  entityType: string;

  /** The entity ID to filter logs by */
  entityId: string;

  /** Optional title for the audit logs section */
  title?: string;

  /** Optional description/subtitle */
  description?: string;

  /** Maximum number of logs to display initially */
  limit?: number;

  /** Whether to show a "Load More" button for pagination */
  showLoadMore?: boolean;

  /** Custom className for the container */
  className?: string;

  /** Whether the component is in a loading state */
  loading?: boolean;

  /** Error message if loading failed */
  error?: string;

  /** Callback when load more is clicked */
  onLoadMore?: () => void;

  /** Whether more logs are available */
  hasMore?: boolean;

  /** Array of audit log entries to display */
  logs?: AuditLogEntry[];

  /** Whether to show filter controls */
  showFilters?: boolean;

  /** Whether to show refresh button */
  showRefresh?: boolean;

  /** Callback when refresh is clicked */
  onRefresh?: () => void;

  /** Current filter values */
  filters?: AuditLogFilters;

  /** Callback when filters change */
  onFiltersChange?: (filters: AuditLogFilters) => void;

  /** Whether to show sorting controls */
  showSorting?: boolean;

  /** Current sorting configuration */
  sorting?: AuditLogSorting;

  /** Callback when sorting changes */
  onSortingChange?: (sorting: AuditLogSorting) => void;
}

export interface AuditLogsTableProps {
  /** Array of audit log entries to display */
  logs: AuditLogEntry[];

  /** Whether the table is in a loading state */
  loading?: boolean;

  /** Custom className for the table */
  className?: string;
}

export interface AuditLogRowProps {
  /** The audit log entry to display */
  log: AuditLogEntry;

  /** Custom className for the row */
  className?: string;
}

/**
 * Event type display configuration
 */
export interface EventTypeConfig {
  /** Display label for the event type */
  label: string;

  /** Icon component for the event type */
  icon?: React.ComponentType<{ className?: string }>;

  /** Color variant for the badge */
  variant?: "default" | "secondary" | "destructive" | "outline";

  /** Description of what this event type represents */
  description?: string;
}

/**
 * Severity level display configuration
 */
export interface SeverityConfig {
  /** Display label for the severity */
  label: string;

  /** Color variant for the badge */
  variant?: "default" | "secondary" | "destructive" | "outline";

  /** Icon component for the severity */
  icon?: React.ComponentType<{ className?: string }>;
}