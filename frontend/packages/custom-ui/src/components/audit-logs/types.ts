/**
 * Audit Logs Component Types
 *
 * Defines TypeScript interfaces for audit log display components.
 */

export interface AuditLogEntry {
  /** Unique identifier for the audit event */
  event_id: string;

  /** When the audit log was created/recorded */
  timestamp: string;

  /** When the actual business event occurred (if available) */
  event_timestamp?: string;

  /** Type of audit event (create, update, delete, read, etc.) */
  event_type: string;

  /** Severity level of the event */
  severity: "low" | "medium" | "high" | "critical";

  /** Type of entity being audited (user, event, booking, etc.) */
  entity_type: string;

  /** ID of the entity being audited */
  entity_id: string;

  /** ID of the user who performed the action */
  user_id?: string;

  /** Email of the user who performed the action */
  user_email?: string;

  /** Session ID associated with the action */
  session_id?: string;

  /** Request ID for tracking the HTTP request */
  request_id?: string;

  /** IP address of the user who performed the action */
  ip_address?: string;

  /** User agent string from the browser/client */
  user_agent?: string;

  /** Human-readable description of the action */
  description: string;

  /** Additional metadata associated with the event */
  metadata: Record<string, any>;

  /** Old values before the change (for update/delete events) */
  old_values?: Record<string, any>;

  /** New values after the change (for create/update events) */
  new_values?: Record<string, any>;

  /** Fields that were changed (for update events) */
  changed_fields?: string[];
}

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

export interface AuditLogFilters {
  /** Filter by event types */
  eventTypes?: string[];

  /** Filter by severity levels */
  severities?: string[];

  /** Filter by user email */
  userEmail?: string;

  /** Filter by date range */
  dateFrom?: string;

  /** Filter by date range */
  dateTo?: string;

  /** Search in description */
  search?: string;
}

export interface AuditLogSorting {
  /** Field to sort by */
  field: 'timestamp' | 'event_timestamp' | 'event_type' | 'severity' | 'user_email' | 'description';

  /** Sort direction */
  direction: 'asc' | 'desc';
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