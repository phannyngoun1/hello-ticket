/**
 * Event Detail Component
 *
 * Display detailed information about an event.
 */

import { Card } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { Calendar, Clock, Database } from "lucide-react";
import type { Event } from "./types";
import { useShow, useShowService } from "../shows";
import { useLayout, useLayoutService } from "../layouts";

export interface EventDetailProps {
  className?: string;
  data?: Event;
  loading?: boolean;
  error?: Error | null;
}

export function EventDetail({
  className,
  data,
  loading = false,
  error = null,
}: EventDetailProps) {
  const showService = useShowService();
  const layoutService = useLayoutService();

  // Fetch show and layout data
  const { data: showData } = useShow(showService, data?.show_id || null);
  const { data: layoutData } = useLayout(
    layoutService,
    data?.layout_id || null
  );
  const formatDate = (value?: Date | string) => {
    if (!value) return "N/A";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const formatFieldValue = (value: unknown) => {
    if (value === null || value === undefined) return "N/A";
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "N/A";
      const potentialDate = new Date(trimmed);
      if (!Number.isNaN(potentialDate.getTime())) {
        return potentialDate.toLocaleString();
      }
      return trimmed;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Error: {error.message}</div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No event selected</div>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-6">
        <div className="pb-6 border-b">
          <h2 className="mb-4  text-foreground">
            {showData?.name || showData?.code || "Event Information"}
          </h2>
          <dl className="space-y-3">
            <div className="flex items-center gap-2">
              <dt className="text-sm font-medium flex items-center gap-2 min-w-[140px]">
                <Calendar className="h-4 w-4" />
                Start Date & Time
              </dt>
              <dd className="text-sm text-muted-foreground">
                {formatDate(data.start_dt)}
              </dd>
            </div>

            <div className="flex items-center gap-2">
              <dt className="text-sm font-medium flex items-center gap-2 min-w-[140px]">
                <Clock className="h-4 w-4" />
                Duration
              </dt>
              <dd className="text-sm text-muted-foreground">
                {formatDuration(data.duration_minutes)}
              </dd>
            </div>

            <div className="flex items-center gap-2">
              <dt className="text-sm font-medium min-w-[140px]">Title</dt>
              <dd className="text-sm text-muted-foreground">
                {formatFieldValue(data.title)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="pb-6 border-b">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            Location & Configuration
          </h3>
          <dl className="space-y-3">
            {data.layout_id && (
              <div className="flex items-center gap-2">
                <dt className="text-sm font-medium min-w-[140px]">Layout</dt>
                <dd className="text-sm text-muted-foreground">
                  {layoutData?.name || formatFieldValue(data.layout_id)}
                </dd>
              </div>
            )}

            <div className="flex items-center gap-2">
              <dt className="text-sm font-medium min-w-[140px]">Show</dt>
              <dd className="text-sm text-muted-foreground">
                {showData?.name ||
                  showData?.code ||
                  formatFieldValue(data.show_id)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="pb-6 border-b">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            Timeline
          </h3>
          <dl className="space-y-3">
            {data.created_at && (
              <div className="flex items-center gap-2">
                <dt className="text-sm font-medium min-w-[140px]">Created</dt>
                <dd className="text-sm text-muted-foreground">
                  {formatDate(data.created_at)}
                </dd>
              </div>
            )}
            {data.updated_at && (
              <div className="flex items-center gap-2">
                <dt className="text-sm font-medium min-w-[140px]">
                  Last Updated
                </dt>
                <dd className="text-sm text-muted-foreground">
                  {formatDate(data.updated_at)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Database className="h-4 w-4" />
            Additional Information
          </h3>
          <dl className="space-y-3">
            <div className="flex items-center gap-2">
              <dt className="text-sm font-medium min-w-[140px]">Tenant ID</dt>
              <dd className="text-sm text-muted-foreground font-mono">
                {formatFieldValue(data.tenant_id)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
