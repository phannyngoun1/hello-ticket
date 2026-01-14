/**
 * Event Detail Component
 *
 * Display detailed information about an event.
 */

import { Card } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  Calendar,
  Clock,
  Database,
  Settings,
  Info,
  Package,
  Eye,
} from "lucide-react";
import type { Event, EventConfigurationType } from "./types";
import { EventConfigurationType as EventConfigurationTypeEnum } from "./types";
import { useShow, useShowService } from "../shows";
import { useLayout, useLayoutService } from "../layouts";
import { useState } from "react";
import { EventSeatListViewOnly } from "./event-seat-list-view-only";
import { useEventSeats } from "./use-events";
import { useEventService } from "./event-provider";
import {
  ButtonTabs,
  DescriptionList,
  DescriptionItem,
} from "@truths/custom-ui";
import type { ButtonTabItem } from "@truths/custom-ui";

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
  const [activeTab, setActiveTab] = useState<
    "information" | "inventory" | "inventory-view"
  >("information");
  const showService = useShowService();
  const layoutService = useLayoutService();
  const eventService = useEventService();

  // Fetch show and layout data
  const { data: showData } = useShow(showService, data?.show_id || null);
  const { data: layoutData } = useLayout(
    layoutService,
    data?.layout_id || null
  );

  // Fetch event seats for view-only tab
  const {
    data: eventSeatsData,
    isLoading: seatsLoading,
    refetch: refetchSeats,
  } = useEventSeats(eventService, data?.id, { skip: 0, limit: 1000 });
  const eventSeats = eventSeatsData?.data || [];

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

  // Build tabs configuration
  const tabs: ButtonTabItem[] = [
    {
      value: "information",
      label: "Information",
      icon: Info,
    },

    {
      value: "inventory-view",
      label: "Inventory",
      icon: Eye,
    },
  ];

  return (
    <Card className={cn("p-6", className)}>
      <div>
        <ButtonTabs
          tabs={tabs}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          {(activeTab) => (
            <div className="mt-0">
              {/* Profile Tab - Keep mounted but hide when inactive */}
              <div
                className={cn(
                  "space-y-6",
                  activeTab !== "information" && "hidden"
                )}
              >
                <DescriptionList
                  title="Event Information"
                  columns={2}
                  className="pb-6 border-b"
                >
                  <DescriptionItem
                    label="Start Date & Time"
                    value={formatDate(data.start_dt)}
                    icon={Calendar}
                  />
                  <DescriptionItem
                    label="Duration"
                    value={formatDuration(data.duration_minutes)}
                    icon={Clock}
                  />
                </DescriptionList>

                <DescriptionList
                  title="Location & Configuration"
                  columns={2}
                  className="pb-6 border-b"
                >
                  <DescriptionItem
                    label="Layout"
                    value={
                      layoutData?.name ||
                      (data.layout_id ? formatFieldValue(data.layout_id) : null)
                    }
                  />
                  <DescriptionItem
                    label="Show"
                    value={
                      showData?.name ||
                      showData?.code ||
                      formatFieldValue(data.show_id)
                    }
                  />
                  <DescriptionItem
                    label="Configuration Type"
                    value={formatConfigurationType(data.configuration_type)}
                    icon={Settings}
                  />
                </DescriptionList>

                <DescriptionList
                  title="Timeline"
                  columns={2}
                  className="pb-6 border-b"
                >
                  <DescriptionItem
                    label="Created"
                    value={data.created_at ? formatDate(data.created_at) : null}
                  />
                  <DescriptionItem
                    label="Last Updated"
                    value={data.updated_at ? formatDate(data.updated_at) : null}
                  />
                </DescriptionList>

                <DescriptionList
                  title="System Metadata"
                  icon={Database}
                  columns={2}
                  className="pt-6 border-t mt-6"
                >
                  <DescriptionItem
                    label="Tenant ID"
                    value={formatFieldValue(data.tenant_id)}
                    valueClassName="font-mono"
                  />
                </DescriptionList>
              </div>

              {/* Inventory View Tab - View only mode without status tabs */}
              <div className={cn(activeTab !== "inventory-view" && "hidden")}>
                <EventSeatListViewOnly
                  eventSeats={eventSeats}
                  isLoading={seatsLoading}
                  onRefresh={refetchSeats}
                />
              </div>
            </div>
          )}
        </ButtonTabs>
      </div>
    </Card>
  );
}
