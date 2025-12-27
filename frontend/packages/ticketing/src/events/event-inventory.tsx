/**
 * Event Inventory Component
 *
 * Displays venue layout with event seats overlaid, allowing management of seat inventory
 */

import { useState, useMemo } from "react";
import { Card, Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  Package,
  RefreshCw,
  Upload,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useEventService } from "./event-provider";
import { useLayoutService } from "../layouts";
import {
  useEvent,
  useEventSeats,
  useInitializeEventSeats,
} from "./use-events";
import { useLayoutWithSeats } from "../layouts/use-layouts";
import type { EventSeat, EventSeatStatus } from "./types";
import { EventSeatStatus as EventSeatStatusEnum } from "./types";
import { EventInventoryViewer } from "./event-inventory-viewer";
import { EventSeatList } from "./event-seat-list";

export interface EventInventoryProps {
  eventId: string;
  className?: string;
}

export function EventInventory({ eventId, className }: EventInventoryProps) {
  const eventService = useEventService();
  const layoutService = useLayoutService();
  const [activeTab, setActiveTab] = useState<"visual" | "list">("visual");

  // Fetch event data
  const {
    data: event,
    isLoading: eventLoading,
    error: eventError,
  } = useEvent(eventService, eventId);

  // Fetch layout with seats if event has a layout
  const {
    data: layoutWithSeats,
    isLoading: layoutLoading,
    error: layoutError,
  } = useLayoutWithSeats(layoutService, event?.layout_id || null);

  // Fetch event seats
  const {
    data: eventSeatsData,
    isLoading: seatsLoading,
    error: seatsError,
    refetch: refetchSeats,
  } = useEventSeats(eventService, eventId, { skip: 0, limit: 1000 });

  const initializeSeatsMutation = useInitializeEventSeats(eventService);

  const eventSeats = eventSeatsData?.data || [];
  const totalSeats = eventSeatsData?.pagination.total || 0;

  // Create a map of seat_id to event seat for quick lookup
  const seatStatusMap = useMemo(() => {
    const map = new Map<string, EventSeat>();
    eventSeats.forEach((eventSeat) => {
      if (eventSeat.seat_id) {
        map.set(eventSeat.seat_id, eventSeat);
      }
    });
    return map;
  }, [eventSeats]);

  // Create a map by location (section, row, seat_number) for broker imports
  const locationStatusMap = useMemo(() => {
    const map = new Map<string, EventSeat>();
    eventSeats.forEach((eventSeat) => {
      if (eventSeat.section_name && eventSeat.row_name && eventSeat.seat_number) {
        const key = `${eventSeat.section_name}|${eventSeat.row_name}|${eventSeat.seat_number}`;
        map.set(key, eventSeat);
      }
    });
    return map;
  }, [eventSeats]);

  const handleInitializeSeats = async () => {
    if (!event?.id) return;
    try {
      await initializeSeatsMutation.mutateAsync(event.id);
      await refetchSeats();
    } catch (err) {
      console.error("Failed to initialize seats:", err);
    }
  };

  const formatDate = (value?: Date | string) => {
    if (!value) return "N/A";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleString();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getStatusCounts = () => {
    const counts: Record<EventSeatStatus, number> = {
      AVAILABLE: 0,
      RESERVED: 0,
      SOLD: 0,
      HELD: 0,
      BLOCKED: 0,
    };
    eventSeats.forEach((seat) => {
      counts[seat.status] = (counts[seat.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (eventLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading event...</div>
          </div>
        </Card>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-destructive">
              Error loading event: {eventError.message}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Event not found</div>
          </div>
        </Card>
      </div>
    );
  }

  const hasLayout = !!event.layout_id;
  const hasSeats = totalSeats > 0;
  const needsInitialization =
    event.configuration_type === "seat_setup" &&
    hasLayout &&
    !hasSeats;

  return (
    <div className={cn("container mx-auto py-6 space-y-6", className)}>
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-2xl font-semibold">{event.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(event.start_dt)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {formatDuration(event.duration_minutes)}
              </div>
              {event.layout_id && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Layout: {layoutWithSeats?.layout.name || "Loading..."}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {hasSeats && (
              <div className="flex items-center flex-wrap gap-x-2 gap-y-2">
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 font-medium text-xs py-0.5 px-2">
                  Available {statusCounts.AVAILABLE}
                </Badge>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 font-medium text-xs py-0.5 px-2">
                  Reserved {statusCounts.RESERVED}
                </Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 font-medium text-xs py-0.5 px-2">
                  Sold {statusCounts.SOLD}
                </Badge>
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 font-medium text-xs py-0.5 px-2">
                  Held {statusCounts.HELD}
                </Badge>
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 font-medium text-xs py-0.5 px-2">
                  Blocked {statusCounts.BLOCKED}
                </Badge>
              </div>
            )}
            {needsInitialization && (
              <Button
                onClick={handleInitializeSeats}
                disabled={initializeSeatsMutation.isPending}
                className="gap-2"
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    initializeSeatsMutation.isPending && "animate-spin"
                  )}
                />
                Initialize Seats
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Warnings */}
      {!hasLayout && event.configuration_type === "seat_setup" && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              This event requires a layout to manage seat inventory. Please assign
              a layout to the event first.
            </span>
          </div>
        </Card>
      )}

      {event.configuration_type === "ticket_import" && !hasSeats && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-2 text-blue-800">
            <Upload className="h-4 w-4" />
            <span className="text-sm">
              This event uses ticket import. Import broker tickets to manage
              inventory.
            </span>
          </div>
        </Card>
      )}

      {/* Main Content */}
      {hasLayout && (
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="visual" className="gap-2">
                <MapPin className="h-4 w-4" />
                Visual Layout
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <Package className="h-4 w-4" />
                Seat List ({totalSeats})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="mt-6">
              {layoutLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading layout...</div>
                </div>
              ) : layoutError ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-destructive">
                    Error loading layout:{" "}
                    {layoutError instanceof Error
                      ? layoutError.message
                      : "Unknown error"}
                  </div>
                </div>
              ) : !layoutWithSeats ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Layout not found</div>
                </div>
              ) : (
                <EventInventoryViewer
                  layout={layoutWithSeats.layout}
                  layoutSeats={layoutWithSeats.seats}
                  eventSeats={eventSeats}
                  seatStatusMap={seatStatusMap}
                  locationStatusMap={locationStatusMap}
                  imageUrl={layoutWithSeats.layout.image_url}
                  isLoading={seatsLoading}
                />
              )}
            </TabsContent>

            <TabsContent value="list" className="mt-6">
              <EventSeatList
                eventSeats={eventSeats}
                isLoading={seatsLoading}
                onRefresh={refetchSeats}
              />
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* No Layout Message */}
      {!hasLayout && (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Layout Assigned</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              This event does not have a layout assigned. Assign a layout to the
              event to manage seat inventory visually.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

