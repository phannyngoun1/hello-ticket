/**
 * Audit Service Types
 *
 * Shared types for audit logging functionality across the application.
 */

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
  sort_by?: string;
  sort_order?: string;
}

/**
 * Single audit log entry from API
 */
export interface AuditLogEntry {
  /** Unique identifier for the audit event */
  event_id: string;

  /** When the actual business event occurred */
  event_timestamp?: string;

  /** Type of audit event (create, update, delete, read, etc.) */
  event_type: string;

  /** Severity level of the event */
  severity: 'low' | 'medium' | 'high' | 'critical';

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
  metadata: Record<string, unknown>;

  /** Old values before the change (for update/delete events) */
  old_values?: Record<string, unknown>;

  /** New values after the change (for create/update events) */
  new_values?: Record<string, unknown>;

  /** Fields that were changed (for update events) */
  changed_fields?: string[];
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
 * Filter options for audit logs
 */
export interface AuditLogFilters {
  /** Filter by event types */
  eventTypes?: string[];

  /** Filter by severity levels */
  severities?: string[];

  /** Filter by user email */
  userEmail?: string;

  /** Filter by date range start */
  dateFrom?: string;

  /** Filter by date range end */
  dateTo?: string;

  /** Search in description */
  search?: string;
}

/**
 * Sorting configuration for audit logs
 */
export interface AuditLogSorting {
  /** Field to sort by */
  field: 'event_timestamp' | 'event_type' | 'severity' | 'user_email' | 'description';

  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Configuration for audit service
 */
export interface AuditServiceConfig {
  /** API client instance for making requests */
  apiClient: {
    get<T>(url: string, options?: { requiresAuth?: boolean }): Promise<T>;
  };
  /** Base URL for audit API endpoints */
  baseUrl?: string;
}
