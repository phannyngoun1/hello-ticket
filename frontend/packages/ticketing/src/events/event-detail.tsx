/**
 * Event Detail Component
 *
 * Display detailed information about an event.
 */

import { Card, Tabs } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  Calendar,
  Clock,
  Database,
  Settings,
  Info,
  Package,
} from "lucide-react";
import type { Event, EventConfigurationType } from "./types";
import { EventConfigurationType as EventConfigurationTypeEnum } from "./types";
import { useShow, useShowService } from "../shows";
import { useLayout, useLayoutService } from "../layouts";
import { useState } from "react";
import { EventInventoryList } from "./event-inventory-list";

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
  const [activeTab, setActiveTab] = useState<"information" | "inventory">(
    "information"
  );
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
    <Card className={cn("p-6", className)}>
      <div>
        
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <div className="border-b mb-4">
            <div className="flex gap-4">
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "information"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("information")}
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Information
                </span>
              </button>
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "inventory"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("inventory")}
              >
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Inventory
                </span>
              </button>
            </div>
          </div>

          <div className="mt-0">
            {/* Profile Tab - Keep mounted but hide when inactive */}
            <div
              className={cn("space-y-6", activeTab !== "information" && "hidden")}
            >
              <div className="pb-6 border-b">
                <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Event Information
                </h3>
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
                </dl>
              </div>

              <div className="pb-6 border-b">
                <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Location & Configuration
                </h3>
                <dl className="space-y-3">
                  {data.layout_id && (
                    <div className="flex items-center gap-2">
                      <dt className="text-sm font-medium min-w-[140px]">
                        Layout
                      </dt>
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
                      <dt className="text-sm font-medium min-w-[140px]">
                        Created
                      </dt>
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

              <div className="pt-6 border-t mt-6">
                <h3 className="mb-4 text-sm font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                  <Database className="h-4 w-4 text-primary" />
                  System Metadata
                </h3>
                <dl className="space-y-3">
                  <div className="flex items-center gap-2">
                    <dt className="text-sm font-medium min-w-[140px]">
                      Tenant ID
                    </dt>
                    <dd className="text-sm text-muted-foreground font-mono">
                      {formatFieldValue(data.tenant_id)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Inventory Tab - Keep mounted but hide when inactive */}
            <div className={cn(activeTab !== "inventory" && "hidden")}>
              {data?.id && (
                <EventInventoryList eventId={data.id} className="border-0 shadow-none" />
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </Card>
  );
}
