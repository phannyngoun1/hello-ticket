/**
 * Event Inventory Component
 *
 * Displays venue layout with event seats overlaid, allowing management of seat inventory
 */

import { useState, useMemo } from "react";
import {
  Card,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@truths/ui";
import {
  InitializeSeatsDialog,
  type InitializeSeatsData,
} from "./initialize-seats-dialog";
import {
  CreateEventSeatDialog,
  type CreateEventSeatData,
} from "./create-event-seat-dialog";
import { cn } from "@truths/ui/lib/utils";
import {
  RefreshCw,
  Upload,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  List,
} from "lucide-react";
import { useEventService } from "./event-provider";
import { useLayoutService } from "../layouts";
import {
  useEvent,
  useEventSeats,
  useInitializeEventSeats,
  useDeleteEventSeats,
  useCreateTicketsFromSeats,
  useCreateEventSeat,
} from "./use-events";
import { useLayoutWithSeats } from "../layouts/use-layouts";
import type { EventSeat, EventSeatStatus } from "./types";
import { EventInventoryViewer } from "./event-inventory-viewer";
import { EventSeatList } from "./event-seat-list";

export interface EventInventoryProps {
  eventId: string;
  className?: string;
}

export function EventInventory({ eventId, className }: EventInventoryProps) {
  const eventService = useEventService();
  const layoutService = useLayoutService();
  const [seatListSheetOpen, setSeatListSheetOpen] = useState(false);
  const [initializeSeatsDialogOpen, setInitializeSeatsDialogOpen] =
    useState(false);
  const [createSeatDialogOpen, setCreateSeatDialogOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );

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
    refetch: refetchSeats,
  } = useEventSeats(eventService, eventId, { skip: 0, limit: 1000 });

  const initializeSeatsMutation = useInitializeEventSeats(eventService);
  const deleteSeatsMutation = useDeleteEventSeats(eventService);
  const createTicketsMutation = useCreateTicketsFromSeats(eventService);
  const createSeatMutation = useCreateEventSeat(eventService);

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
      if (
        eventSeat.section_name &&
        eventSeat.row_name &&
        eventSeat.seat_number
      ) {
        const key = `${eventSeat.section_name}|${eventSeat.row_name}|${eventSeat.seat_number}`;
        map.set(key, eventSeat);
      }
    });
    return map;
  }, [eventSeats]);

  // Check if there are missing seats (layout seats not yet assigned to event)
  // This hook must be called before any early returns to follow Rules of Hooks
  const hasMissingSeats = useMemo(() => {
    if (
      !event ||
      !event.layout_id ||
      !layoutWithSeats ||
      event.configuration_type !== "seat_setup"
    ) {
      return false;
    }

    const layoutSeats = layoutWithSeats.seats;
    if (layoutSeats.length === 0) return false;

    // Create maps for existing event seats
    const existingSeatIds = new Set<string>();
    const existingLocations = new Set<string>();

    // Create section name map
    const sectionNameMap = new Map<string, string>();
    layoutWithSeats.sections.forEach((section) => {
      sectionNameMap.set(section.id, section.name);
    });

    eventSeats.forEach((eventSeat) => {
      if (eventSeat.seat_id) {
        existingSeatIds.add(eventSeat.seat_id);
      }
      if (
        eventSeat.section_name &&
        eventSeat.row_name &&
        eventSeat.seat_number
      ) {
        const key = `${eventSeat.section_name}|${eventSeat.row_name}|${eventSeat.seat_number}`;
        existingLocations.add(key);
      }
    });

    // Check if any layout seats are missing
    return layoutSeats.some((layoutSeat) => {
      // Check by seat_id
      if (layoutSeat.id && existingSeatIds.has(layoutSeat.id)) {
        return false;
      }

      // Check by location
      const sectionName = sectionNameMap.get(layoutSeat.section_id);
      if (sectionName && layoutSeat.row && layoutSeat.seat_number) {
        const locationKey = `${sectionName}|${layoutSeat.row}|${layoutSeat.seat_number}`;
        if (existingLocations.has(locationKey)) {
          return false;
        }
      }

      return true; // This seat is missing
    });
  }, [event, layoutWithSeats, eventSeats]);

  const handleInitializeSeats = async () => {
    if (!event?.id) return;
    setInitializeSeatsDialogOpen(true);
  };

  const handleInitializeSeatsSubmit = async (data: InitializeSeatsData) => {
    if (!event?.id) return;
    try {
      // Initialize seats with optional ticket generation and section pricing
      await initializeSeatsMutation.mutateAsync({
        eventId: event.id,
        generateTickets: data.generateTicketCodes,
        ticketPrice: data.defaultPrice,
        pricingMode: data.pricingMode,
        sectionPricing: data.sectionPricing,
        seatPricing: data.seatPricing,
        includedSectionIds: data.includedSectionIds,
        excludedSectionIds: data.excludedSectionIds,
      });

      await refetchSeats();
      setInitializeSeatsDialogOpen(false);
    } catch (err) {
      console.error("Failed to initialize seats:", err);
      throw err;
    }
  };

  const handleDeleteSeats = async (seatIds: string[]) => {
    if (!event?.id || seatIds.length === 0) return;
    try {
      await deleteSeatsMutation.mutateAsync({ eventId: event.id, seatIds });
      await refetchSeats();
    } catch (err) {
      console.error("Failed to delete seats:", err);
      throw err; // Re-throw so the confirmation dialog can handle it
    }
  };

  const handleCreateTickets = async (
    seatIds: string[],
    ticketPrice: number
  ) => {
    if (!event?.id || seatIds.length === 0) return;
    try {
      await createTicketsMutation.mutateAsync({
        eventId: event.id,
        seatIds,
        ticketPrice,
      });
      await refetchSeats();
    } catch (err) {
      console.error("Failed to create tickets:", err);
      throw err;
    }
  };

  const handleCreateSeat = async (data: CreateEventSeatData) => {
    if (!event?.id) return;
    try {
      await createSeatMutation.mutateAsync({
        eventId: event.id,
        input: {
          seat_id: data.seat_id,
          section_name: data.section_name,
          row_name: data.row_name,
          seat_number: data.seat_number,
          broker_id: data.broker_id,
          create_ticket: data.create_ticket,
          ticket_price: data.ticket_price,
          ticket_number: data.ticket_number,
        },
      });
      await refetchSeats();
      setCreateSeatDialogOpen(false);
    } catch (err) {
      console.error("Failed to create event seat:", err);
      throw err;
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
    event.configuration_type === "seat_setup" && hasLayout && !hasSeats;

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
                <span
                  className="inline-flex items-center rounded-full border font-medium text-xs py-0.5 px-2 text-white"
                  style={{ backgroundColor: "#10b981", borderColor: "#059669" }}
                >
                  Available {statusCounts.AVAILABLE}
                </span>
                <span
                  className="inline-flex items-center rounded-full border font-medium text-xs py-0.5 px-2 text-white"
                  style={{ backgroundColor: "#eab308", borderColor: "#ca8a04" }}
                >
                  Reserved {statusCounts.RESERVED}
                </span>
                <span
                  className="inline-flex items-center rounded-full border font-medium text-xs py-0.5 px-2 text-white"
                  style={{ backgroundColor: "#3b82f6", borderColor: "#2563eb" }}
                >
                  Sold {statusCounts.SOLD}
                </span>
                <span
                  className="inline-flex items-center rounded-full border font-medium text-xs py-0.5 px-2 text-white"
                  style={{ backgroundColor: "#a855f7", borderColor: "#9333ea" }}
                >
                  Held {statusCounts.HELD}
                </span>
                <span
                  className="inline-flex items-center rounded-full border font-medium text-xs py-0.5 px-2 text-white"
                  style={{ backgroundColor: "#ef4444", borderColor: "#dc2626" }}
                >
                  Blocked {statusCounts.BLOCKED}
                </span>
              </div>
            )}
            {(needsInitialization || hasMissingSeats) && (
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
                {needsInitialization ? "Initialize Seats" : "Add Seats"}
              </Button>
            )}
            {hasSeats && (
              <Button
                onClick={() => setSeatListSheetOpen(true)}
                variant="outline"
                size="icon"
                title={`View Seat List (${totalSeats})`}
              >
                <List className="h-4 w-4" />
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
              This event requires a layout to manage seat inventory. Please
              assign a layout to the event first.
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

      {/* Main Content - Visual Layout Only */}
      {hasLayout && (
        <Card className="p-6">
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
              sections={layoutWithSeats.sections}
              eventSeats={eventSeats}
              seatStatusMap={seatStatusMap}
              locationStatusMap={locationStatusMap}
              imageUrl={layoutWithSeats.layout.image_url}
              isLoading={seatsLoading}
              selectedSectionId={selectedSectionId}
              onSelectedSectionIdChange={setSelectedSectionId}
            />
          )}
        </Card>
      )}

      {/* Seat List Sheet */}
      <Sheet open={seatListSheetOpen} onOpenChange={setSeatListSheetOpen}>
        <SheetContent
          side="right"
          className="w-[600px] sm:w-[740px] sm:max-w-[740px] flex flex-col p-0 overflow-hidden"
          style={{ width: "600px", maxWidth: "740px" }}
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <SheetTitle>Seat List ({totalSeats})</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 min-w-0">
            <EventSeatList
              eventSeats={eventSeats}
              isLoading={seatsLoading}
              onDelete={handleDeleteSeats}
              onCreateTickets={handleCreateTickets}
            />
          </div>
        </SheetContent>
      </Sheet>

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

      {/* Initialize Seats Dialog */}
      {layoutWithSeats && (
        <InitializeSeatsDialog
          open={initializeSeatsDialogOpen}
          onClose={() => setInitializeSeatsDialogOpen(false)}
          onSubmit={handleInitializeSeatsSubmit}
          layoutSeats={layoutWithSeats.seats}
          sections={layoutWithSeats.sections}
          existingEventSeats={eventSeats}
          loading={initializeSeatsMutation.isPending}
          designMode={layoutWithSeats.layout.design_mode}
          selectedSectionId={selectedSectionId}
        />
      )}

      {/* Create Event Seat Dialog */}
      <CreateEventSeatDialog
        open={createSeatDialogOpen}
        onOpenChange={setCreateSeatDialogOpen}
        onSubmit={handleCreateSeat}
        loading={createSeatMutation.isPending}
      />
    </div>
  );
}
