/**
 * Event Detail Component
 *
 * Display detailed information about an event.
 */

import { Card, Button } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { Calendar, Clock, Database, Settings, RefreshCw, Upload, Armchair, ExternalLink } from "lucide-react";
import type { Event, EventConfigurationType } from "./types";
import { EventConfigurationType as EventConfigurationTypeEnum } from "./types";
import { useShow, useShowService } from "../shows";
import { useLayout, useLayoutService } from "../layouts";
import { useEventService } from "./event-provider";
import { useInitializeEventSeats, useEventSeats } from "./use-events";
import { useState } from "react";

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
  const eventService = useEventService();

  // Fetch show and layout data
  const { data: showData } = useShow(showService, data?.show_id || null);
  const { data: layoutData } = useLayout(
    layoutService,
    data?.layout_id || null
  );

  const { data: seatsData, isLoading: isLoadingSeats } = useEventSeats(
    eventService,
    data?.id || "",
    { limit: 1 }
  );

  const initializeSeatsMutation = useInitializeEventSeats(eventService);
  const [isInitializing, setIsInitializing] = useState(false);

  const handleInitializeSeats = async () => {
    if (!data?.id) return;
    setIsInitializing(true);
    try {
      await initializeSeatsMutation.mutateAsync({
        eventId: data.id,
        generateTickets: false, // Default to false, tickets can be created later
      });
    } catch (err) {
      console.error("Failed to initialize seats:", err);
    } finally {
      setIsInitializing(false);
    }
  };

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

  const formatConfigurationType = (type: EventConfigurationType) => {
    switch (type) {
      case EventConfigurationTypeEnum.SEAT_SETUP:
        return "Seat Setup";
      case EventConfigurationTypeEnum.TICKET_IMPORT:
        return "Ticket Import";
      default:
        return type;
    }
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
          <h2 className="mb-4 text-foreground font-semibold text-lg">
            {showData?.name || showData?.code || "Event Information"}
          </h2>
          <dl className="space-y-3">
            <div className="flex items-center gap-2">
              <dt className="text-sm font-medium flex items-center gap-2 min-w-[140px]">
                <Calendar className="h-4 w-4 text-primary" />
                Start Date & Time
              </dt>
              <dd className="text-sm text-muted-foreground">
                {formatDate(data.start_dt)}
              </dd>
            </div>

            <div className="flex items-center gap-2">
              <dt className="text-sm font-medium flex items-center gap-2 min-w-[140px]">
                <Clock className="h-4 w-4 text-primary" />
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
          <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
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

            <div className="flex items-center gap-2">
              <dt className="text-sm font-medium flex items-center gap-2 min-w-[140px]">
                <Settings className="h-4 w-4 text-primary" />
                Configuration Type
              </dt>
              <dd className="text-sm text-muted-foreground">
                {formatConfigurationType(data.configuration_type)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="pb-6 border-b">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
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

        <div className="pt-2">
          <h3 className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
            <Armchair className="h-3.5 w-3.5 text-primary" />
            Inventory Management
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs font-medium">Seat Inventory</p>
                  <p className="text-xs text-muted-foreground">
                    {isLoadingSeats
                      ? "Loading..."
                      : seatsData?.pagination.total === 0
                      ? "No seats initialized"
                      : `${seatsData?.pagination.total} seats`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {data.configuration_type ===
                  EventConfigurationTypeEnum.SEAT_SETUP && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleInitializeSeats}
                    disabled={isInitializing || !data.layout_id}
                    className="gap-1.5 h-7 text-xs px-2"
                  >
                    <RefreshCw
                      className={cn("h-3.5 w-3.5", isInitializing && "animate-spin")}
                    />
                    {seatsData?.pagination.total === 0
                      ? "Initialize"
                      : "Regenerate"}
                  </Button>
                )}
                {data.configuration_type ===
                  EventConfigurationTypeEnum.TICKET_IMPORT && (
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs px-2">
                    <Upload className="h-3.5 w-3.5" />
                    Import
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="default"
                  asChild
                  className="gap-1.5 h-7 text-xs px-2"
                >
                  <a href={`/ticketing/events/${data.id}/inventory`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    Manage
                  </a>
                </Button>
              </div>
            </div>
            {data.configuration_type ===
              EventConfigurationTypeEnum.SEAT_SETUP &&
              !data.layout_id && (
                <p className="text-xs text-destructive px-1">
                  A layout must be assigned to initialize seats.
                </p>
              )}
          </div>
        </div>

        <div className="pt-6 border-t mt-6">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
            <Database className="h-4 w-4 text-primary" />
            System Metadata
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
