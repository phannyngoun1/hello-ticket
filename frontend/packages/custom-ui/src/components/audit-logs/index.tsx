/**
 * Audit Logs Component
 *
 * A reusable component for displaying audit logs across different entities.
 * Shows chronological activity logs with event types, timestamps, users, and descriptions.
 *
 * Features:
 * - Entity-specific filtering
 * - Chronological display (newest first)
 * - Event type badges with icons
 * - Severity indicators
 * - User attribution
 * - Expandable details
 * - Responsive design
 */

import React, { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@truths/ui";
import {
  Badge,
  Button,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@truths/ui";
import {
  Eye,
  Plus,
  Edit3,
  Trash2,
  User,
  Clock,
  BarChart3,
  AlertTriangle,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Filter,
} from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { useAuditLogs } from "@truths/shared";
import type { AuditLogSorting } from "@truths/shared";
import type {
  AuditLogsProps,
  AuditLogsTableProps,
  AuditLogRowProps,
  EventTypeConfig,
  SeverityConfig,
} from "./types";

/**
 * Configuration for different event types
 */
const EVENT_TYPE_CONFIGS: Record<string, EventTypeConfig> = {
  create: {
    label: "Created",
    icon: Plus,
    variant: "default" as const,
    description: "Entity was created",
  },
  update: {
    label: "Updated",
    icon: Edit3,
    variant: "secondary" as const,
    description: "Entity was modified",
  },
  delete: {
    label: "Deleted",
    icon: Trash2,
    variant: "destructive" as const,
    description: "Entity was deleted",
  },
  read: {
    label: "Viewed",
    icon: Eye,
    variant: "outline" as const,
    description: "Entity was accessed",
  },
  login: {
    label: "Login",
    icon: User,
    variant: "default" as const,
    description: "User logged in",
  },
  logout: {
    label: "Logout",
    icon: User,
    variant: "outline" as const,
    description: "User logged out",
  },
};

/**
 * Configuration for severity levels
 */
const SEVERITY_CONFIGS: Record<string, SeverityConfig> = {
  low: {
    label: "Low",
    variant: "outline" as const,
    icon: Info,
  },
  medium: {
    label: "Medium",
    variant: "secondary" as const,
    icon: BarChart3,
  },
  high: {
    label: "High",
    variant: "destructive" as const,
    icon: AlertTriangle,
  },
  critical: {
    label: "Critical",
    variant: "destructive" as const,
    icon: AlertCircle,
  },
};

/**
 * Main Audit Logs Component
 */
export function AuditLogs({
  entityType,
  entityId,
  title = "Audit Logs",
  description = "Activity history for this entity",
  limit = 50,
  showLoadMore = true,
  className,
  loading = false,
  error,
  onLoadMore,
  hasMore = false,
  showFilters = true,
  showRefresh = true,
  onRefresh,
  filters,
  onFiltersChange,
  showSorting = true,
  sorting,
  onSortingChange,
  logs: propLogs,
}: AuditLogsProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || {}); // Applied filters
  const [pendingFilters, setPendingFilters] = useState(filters || {}); // Filters being edited
  const [localSorting, setLocalSorting] = useState<AuditLogSorting>(sorting || { field: 'event_timestamp', direction: 'desc' });

  // Use API service when no logs prop provided
  const {
    logs: apiLogs,
    loading: apiLoading,
    hasMore: apiHasMore,
    loadMore: apiLoadMore,
    refresh: apiRefresh,
    loadLogs: apiLoadLogs,
  } = useAuditLogs(entityType, entityId, localFilters, {
    autoLoad: !propLogs, // Only auto-load if no logs prop provided
    limit,
    sortBy: localSorting.field,
    sortOrder: localSorting.direction,
  });

  // Determine which data source to use
  const rawLogs = propLogs || apiLogs || [];
  const displayLoading = loading !== undefined ? loading : apiLoading;

  const displayHasMore = hasMore !== undefined ? hasMore : apiHasMore;

  // Use raw logs directly - sorting is done server-side
  const displayLogs = rawLogs;

  const toggleRowExpansion = useCallback((eventId: string) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(eventId)) {
        newExpanded.delete(eventId);
      } else {
        newExpanded.add(eventId);
      }
      return newExpanded;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh(); // Use custom refresh callback if provided
    } else if (!propLogs) {
      apiRefresh(); // Use API refresh when no logs prop provided
    }
  }, [onRefresh, propLogs, apiRefresh]);

  // Update pending filters (doesn't trigger API call)
  const updatePendingFilters = useCallback((newFilters: any) => {
    setPendingFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Apply pending filters and trigger API call
  const applyFilters = useCallback(() => {
    setLocalFilters(pendingFilters);
    setShowFilterPanel(false);

    if (onFiltersChange) {
      onFiltersChange(pendingFilters);
    }

    // Trigger API reload with new filters
    if (!propLogs && apiLoadLogs) {
      apiLoadLogs(pendingFilters, true);
    }
  }, [pendingFilters, onFiltersChange, propLogs, apiLoadLogs]);

  // Track previous sorting to detect actual changes
  const prevSortingRef = React.useRef(localSorting);

  // Reload API data when sorting changes (server-side sorting)
  React.useEffect(() => {
    const sortingChanged = 
      prevSortingRef.current.field !== localSorting.field ||
      prevSortingRef.current.direction !== localSorting.direction;

    if (!propLogs && sortingChanged) {
      prevSortingRef.current = localSorting;
      apiRefresh();
    }
  }, [localSorting, propLogs, apiRefresh]);

  const clearFilters = useCallback(() => {
    const emptyFilters = {};
    setPendingFilters(emptyFilters);
    setLocalFilters(emptyFilters);
    setShowFilterPanel(false);
    if (onFiltersChange) {
      onFiltersChange(emptyFilters);
    }
    // Trigger API reload with cleared filters
    if (!propLogs && apiLoadLogs) {
      apiLoadLogs(emptyFilters, true);
    }
  }, [onFiltersChange, propLogs, apiLoadLogs]);

  const hasActiveFilters = Object.values(localFilters).some(value =>
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  );


  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showFilters && (
              <Popover 
                open={showFilterPanel} 
                onOpenChange={(open) => {
                  setShowFilterPanel(open);
                  // Reset pending filters to current applied filters when opening
                  if (open) {
                    setPendingFilters(localFilters);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Filter className="h-4 w-4 mr-1" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                        !
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    {/* Header with Apply and Clear buttons */}
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filter Audit Logs</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-7 px-2 text-xs"
                        >
                          Clear
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={applyFilters}
                          className="h-7 px-3 text-xs"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>

                    {/* Event Type Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Event Types</label>
                      <Select
                        value={pendingFilters.eventTypes && pendingFilters.eventTypes.length > 0 ? pendingFilters.eventTypes.join(',') : 'all-types'}
                        onValueChange={(value) => {
                          if (value && value !== '') {
                            updatePendingFilters({ eventTypes: value === 'all-types' ? [] : value.split(',') });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All event types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-types">All event types</SelectItem>
                          <SelectItem value="create">Created</SelectItem>
                          <SelectItem value="update">Updated</SelectItem>
                          <SelectItem value="delete">Deleted</SelectItem>
                          <SelectItem value="read">Viewed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Severity Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Severity</label>
                      <Select
                        value={pendingFilters.severities && pendingFilters.severities.length > 0 ? pendingFilters.severities.join(',') : 'all-severities'}
                        onValueChange={(value) => {
                          if (value && value !== '') {
                            updatePendingFilters({ severities: value === 'all-severities' ? [] : value.split(',') });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All severities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-severities">All severities</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* User Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">User Email</label>
                      <Input
                        placeholder="Filter by user email..."
                        value={pendingFilters.userEmail || ''}
                        onChange={(e) => updatePendingFilters({ userEmail: e.target.value })}
                        className="h-8"
                      />
                    </div>

                    {/* Date Range Filter */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">From Date</label>
                        <Input
                          type="date"
                          value={pendingFilters.dateFrom || ''}
                          onChange={(e) => updatePendingFilters({ dateFrom: e.target.value })}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">To Date</label>
                        <Input
                          type="date"
                          value={pendingFilters.dateTo || ''}
                          onChange={(e) => updatePendingFilters({ dateTo: e.target.value })}
                          className="h-8"
                        />
                      </div>
                    </div>

                    {/* Search */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Search Description</label>
                      <Input
                        placeholder="Search in descriptions..."
                        value={pendingFilters.search || ''}
                        onChange={(e) => updatePendingFilters({ search: e.target.value })}
                        className="h-8"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {showSorting && (
              <Select
                value={`${localSorting.field}-${localSorting.direction}`}
                onValueChange={(value) => {
                  const [field, direction] = value.split('-') as [AuditLogSorting['field'], 'asc' | 'desc'];
                  const newSorting: AuditLogSorting = {
                    field,
                    direction
                  };
                  setLocalSorting(newSorting);
                  if (onSortingChange) {
                    onSortingChange(newSorting);
                  }
                }}
              >
                <SelectTrigger className="w-48 h-8">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event_timestamp-desc">Event Time (Newest)</SelectItem>
                  <SelectItem value="event_timestamp-asc">Event Time (Oldest)</SelectItem>
                  <SelectItem value="event_type-asc">Event Type (A-Z)</SelectItem>
                  <SelectItem value="event_type-desc">Event Type (Z-A)</SelectItem>
                  <SelectItem value="severity-desc">Severity (High-Low)</SelectItem>
                  <SelectItem value="severity-asc">Severity (Low-High)</SelectItem>
                  <SelectItem value="user_email-asc">User (A-Z)</SelectItem>
                  <SelectItem value="user_email-desc">User (Z-A)</SelectItem>
                  <SelectItem value="description-asc">Description (A-Z)</SelectItem>
                  <SelectItem value="description-desc">Description (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            )}

            {showRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="h-8"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            )}

           
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <AuditLogsTable
          logs={displayLogs}
          loading={displayLoading}
          expandedRows={expandedRows}
          onToggleRowExpansion={toggleRowExpansion}
        />

        {showLoadMore && displayHasMore && !displayLoading && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (onLoadMore) {
                  onLoadMore(); // Use custom load more callback
                } else if (!propLogs) {
                  apiLoadMore(); // Use API load more
                }
              }}
            >
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Audit Logs Table Component
 */
function AuditLogsTable({
  logs,
  loading,
  expandedRows,
  onToggleRowExpansion,
}: AuditLogsTableProps & {
  expandedRows: Set<string>;
  onToggleRowExpansion: (eventId: string) => void;
}) {
  // Safety check for undefined logs
  const safeLogs = logs || [];

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (safeLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Audit Logs</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          There are no audit logs available for this entity yet. Activity will appear here as actions are performed.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[600px] overflow-y-auto">
      <div className="space-y-2">
        {safeLogs.map((log) => (
          <AuditLogRow
            key={log.event_id}
            log={log}
            expanded={expandedRows.has(log.event_id)}
            onToggleExpansion={() => onToggleRowExpansion(log.event_id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual Audit Log Row Component
 */
function AuditLogRow({
  log,
  expanded,
  onToggleExpansion,
}: AuditLogRowProps & {
  expanded: boolean;
  onToggleExpansion: () => void;
}) {
  const eventConfig = EVENT_TYPE_CONFIGS[log.event_type] || {
    label: log.event_type,
    variant: "outline" as const,
  };

  const severityConfig = SEVERITY_CONFIGS[log.severity] || {
    label: log.severity,
    variant: "outline" as const,
  };

  const EventIcon = eventConfig.icon;
  const SeverityIcon = severityConfig.icon;

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).replace(',', ' at');
    } catch {
      return timestamp;
    }
  };

  const hasDetails = log.old_values || log.new_values || log.changed_fields || log.metadata;

  return (
    <div className="border rounded-lg bg-card">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={hasDetails ? onToggleExpansion : undefined}
      >
        {/* Event Icon */}
        <div className="flex-shrink-0">
          {EventIcon && (
            <div className="p-2 bg-muted rounded-md">
              <EventIcon className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={eventConfig.variant} className="text-xs">
              {eventConfig.label}
            </Badge>
            <Badge variant={severityConfig.variant} className="text-xs">
              {SeverityIcon && <SeverityIcon className="h-3 w-3 mr-1" />}
              {severityConfig.label}
            </Badge>
            {log.user_email && (
              <span className="text-xs text-muted-foreground truncate">
                by {log.user_email}
              </span>
            )}
          </div>

          <p className="text-sm font-medium">{log.description}</p>

          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {log.event_timestamp ? formatTimestamp(log.event_timestamp) : 'Unknown time'}
            </div>
            {log.ip_address && (
              <span className="truncate">IP: {log.ip_address}</span>
            )}
          </div>
        </div>

        {/* Expand/Collapse Button */}
        {hasDetails && (
          <Button variant="ghost" size="sm" className="flex-shrink-0 p-1">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && hasDetails && (
        <div className="px-4 pb-4 border-t bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {log.old_values && Object.keys(log.old_values).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-destructive">Before</h4>
                <pre className="text-xs bg-destructive/10 p-2 rounded border overflow-x-auto">
                  {JSON.stringify(log.old_values, null, 2)}
                </pre>
              </div>
            )}

            {log.new_values && Object.keys(log.new_values).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-green-700">After</h4>
                <pre className="text-xs bg-green-50 p-2 rounded border overflow-x-auto">
                  {JSON.stringify(log.new_values, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {log.changed_fields && log.changed_fields.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Changed Fields</h4>
              <div className="flex flex-wrap gap-1">
                {log.changed_fields.map((field) => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Additional Details</h4>
              <pre className="text-xs bg-muted p-2 rounded border overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// Re-export types and hooks from shared package
export type { AuditLogsProps, AuditLogEntry } from "./types";
export {
  useAuditLogs,
  AuditService,
  AuditProvider,
  useAuditService,
  type AuditLogParams,
  type AuditLogResponse,
  type AuditServiceConfig,
} from "@truths/shared";