/**
 * Create Booking Dialog Component
 *
 * Full-screen dialog for creating booking transactions with seat selection.
 * Features:
 * - Left section: Seat layout visualization/list with show/event selection
 * - Right section: Customer information and ticket list
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "@truths/ui/lib/utils";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
  Separator,
  Input,
  Label,
  Switch,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@truths/ui";
import { LayoutGrid, List, Trash2 } from "lucide-react";
import { ShowService } from "@truths/ticketing/shows";
import { EventService } from "@truths/ticketing/events";
import { useShows, useEvents } from "@truths/ticketing";
import { useEvent } from "@truths/ticketing/events";
import { LayoutService, useLayoutWithSeats } from "@truths/ticketing/layouts";
import { useEventSeats } from "@truths/ticketing/events";
import { api } from "@truths/api";
import { EventInventoryViewer } from "@truths/ticketing/events/event-inventory-viewer";
import { EventSeatList } from "@truths/ticketing/events/event-seat-list";
import type { EventSeat } from "@truths/ticketing/events/types";
import type { Customer } from "../types";
import type { CreateBookingInput } from "./types";

export interface BookingTicket {
  eventSeatId: string;
  seatId?: string;
  sectionName?: string;
  rowName?: string;
  seatNumber?: string;
  ticketPrice?: number;
  ticketNumber?: string;
  status: string;
}

export interface CreateBookingTransactionData {
  customerId?: string;
  customer?: Customer;
  eventId: string;
  tickets: BookingTicket[];
}

export interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBookingInput) => Promise<void>;
  title?: string;
  maxWidth?: string;
}

export function CreateBookingDialog({
  open,
  onOpenChange,
  onSubmit,
  title = "Create Booking",
  maxWidth = "95vw",
}: CreateBookingDialogProps) {
  const density = useDensityStyles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] =
    useState<CreateBookingTransactionData | null>(null);

  // Show and Event selection
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Popover open states
  const [showPopoverOpen, setShowPopoverOpen] = useState(false);
  const [eventPopoverOpen, setEventPopoverOpen] = useState(false);

  // Seat view mode: 'visualization' | 'list'
  const [seatViewMode, setSeatViewMode] = useState<"visualization" | "list">(
    "visualization"
  );

  // Selected tickets
  const [selectedTickets, setSelectedTickets] = useState<BookingTicket[]>([]);

  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );

  // Discount type: 'percentage' or 'amount'
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    "percentage"
  );
  // Discount value (percentage or amount)
  const [discountValue, setDiscountValue] = useState<string>("0");

  // Create services directly using API client
  const showService = useMemo(
    () =>
      new ShowService({
        apiClient: api,
        endpoints: {
          shows: "/api/v1/ticketing/shows",
        },
      }),
    []
  );

  const eventService = useMemo(
    () =>
      new EventService({
        apiClient: api,
        endpoints: {
          events: "/api/v1/ticketing/events",
        },
      }),
    []
  );

  const layoutService = useMemo(
    () =>
      new LayoutService({
        apiClient: api,
        endpoints: {
          layouts: "/api/v1/ticketing/layouts",
        },
      }),
    []
  );

  // Fetch shows
  const { data: showsData } = useShows(showService, {
    pagination: { page: 1, pageSize: 100 },
  });
  // Deduplicate shows by ID to prevent duplicates in select box
  const shows = useMemo(() => {
    const showsArray = showsData?.data || [];
    const uniqueShows = new Map<string, (typeof showsArray)[0]>();
    showsArray.forEach((show) => {
      if (!uniqueShows.has(show.id)) {
        uniqueShows.set(show.id, show);
      }
    });
    return Array.from(uniqueShows.values());
  }, [showsData?.data]);

  // Fetch events for selected show
  const { data: eventsData } = useEvents(eventService, {
    filter: selectedShowId ? { show_id: selectedShowId } : undefined,
    pagination: { page: 1, pageSize: 200 },
  });
  const events = eventsData?.data || [];

  // Fetch event data
  const { data: event } = useEvent(eventService, selectedEventId);

  // Fetch layout with seats
  const { data: layoutWithSeats } = useLayoutWithSeats(
    layoutService,
    event?.layout_id || null
  );

  // Fetch event seats
  const { data: eventSeatsData } = useEventSeats(
    eventService,
    selectedEventId || "",
    { skip: 0, limit: 1000 }
  );
  const eventSeats = eventSeatsData?.data || [];

  // Create maps for seat status lookup
  const seatStatusMap = useMemo(() => {
    const map = new Map<string, EventSeat>();
    eventSeats.forEach((eventSeat) => {
      if (eventSeat.seat_id) {
        map.set(eventSeat.seat_id, eventSeat);
      }
    });
    return map;
  }, [eventSeats]);

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

  // Handle event selection change
  useEffect(() => {
    if (selectedEventId) {
      // Clear selected tickets when event changes
      setSelectedTickets([]);
    }
  }, [selectedEventId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedShowId(null);
      setSelectedEventId(null);
      setSelectedTickets([]);
      setSelectedCustomerId(null);
      setSeatViewMode("visualization");
      setPendingData(null);
      setShowConfirmDialog(false);
    }
  }, [open]);

  // Handle seat selection from visualization
  const handleSeatClick = useCallback(
    (seatId: string, eventSeat?: EventSeat) => {
      if (!selectedEventId) return;

      // If no eventSeat provided, try to find it
      let targetEventSeat = eventSeat;
      if (!targetEventSeat && seatId) {
        // Try to find by seat_id
        targetEventSeat = seatStatusMap.get(seatId);
        // If not found, try to find by location
        if (!targetEventSeat && layoutWithSeats) {
          const seat = layoutWithSeats.seats.find((s) => s.id === seatId);
          if (seat && seat.section_name && seat.row && seat.seat_number) {
            const key = `${seat.section_name}|${seat.row}|${seat.seat_number}`;
            targetEventSeat = locationStatusMap.get(key);
          }
        }
      }

      if (!targetEventSeat) return;

      // Check if seat is already selected
      const existingIndex = selectedTickets.findIndex(
        (t) => t.eventSeatId === targetEventSeat!.id
      );

      if (existingIndex >= 0) {
        // Remove from selection
        setSelectedTickets((prev) =>
          prev.filter((_, i) => i !== existingIndex)
        );
      } else {
        // Add to selection (only if available - normalize to uppercase for comparison)
        const statusUpper = targetEventSeat.status?.toUpperCase();
        if (statusUpper === "AVAILABLE") {
          const ticket: BookingTicket = {
            eventSeatId: targetEventSeat.id,
            seatId: targetEventSeat.seat_id,
            sectionName: targetEventSeat.section_name,
            rowName: targetEventSeat.row_name,
            seatNumber: targetEventSeat.seat_number,
            ticketPrice: targetEventSeat.ticket_price,
            ticketNumber: targetEventSeat.ticket_number,
            status: targetEventSeat.status,
          };
          setSelectedTickets((prev) => [...prev, ticket]);
        }
      }
    },
    [
      selectedEventId,
      selectedTickets,
      seatStatusMap,
      locationStatusMap,
      layoutWithSeats,
    ]
  );

  // Handle seat selection from list (for checkbox selection only, not auto-add to booking)
  const handleListSeatSelect = useCallback(
    (_eventSeat: EventSeat, _checked: boolean) => {
      // This is just for visual selection state, not auto-adding to booking
      // The "Add to Booking" button will handle adding selected seats
      // Selection state is managed internally by EventSeatList when showAddToBooking is true
    },
    []
  );

  // Handle adding selected seats to booking list
  const handleAddSeatsToBooking = useCallback(
    (seatIds: string[]) => {
      if (!selectedEventId || seatIds.length === 0) return;

      // Use functional update to avoid dependency on selectedTickets
      setSelectedTickets((prevTickets) => {
        // Get all seats to add
        const seatsToAdd = seatIds
          .map((seatId) => eventSeats.find((s) => s.id === seatId))
          .filter((seat): seat is EventSeat => {
            if (!seat) return false;
            // Only add AVAILABLE seats (normalize to uppercase for comparison)
            const statusUpper = seat.status?.toUpperCase();
            if (statusUpper !== "AVAILABLE") return false;
            // Check if already in booking list using prevTickets
            const alreadyAdded = prevTickets.some(
              (t) => t.eventSeatId === seat.id
            );
            return !alreadyAdded;
          });

        if (seatsToAdd.length === 0) return prevTickets;

        // Create tickets for all seats to add
        const newTickets: BookingTicket[] = seatsToAdd.map((eventSeat) => ({
          eventSeatId: eventSeat.id,
          seatId: eventSeat.seat_id,
          sectionName: eventSeat.section_name,
          rowName: eventSeat.row_name,
          seatNumber: eventSeat.seat_number,
          ticketPrice: eventSeat.ticket_price,
          ticketNumber: eventSeat.ticket_number,
          status: eventSeat.status,
        }));

        // Add all tickets at once
        return [...prevTickets, ...newTickets];
      });
    },
    [selectedEventId, eventSeats]
  );

  // Calculate subtotal
  const subtotalAmount = useMemo(() => {
    return selectedTickets.reduce((sum, ticket) => {
      return sum + (ticket.ticketPrice || 0);
    }, 0);
  }, [selectedTickets]);

  // Calculate discount
  const discountAmount = useMemo(() => {
    const value = parseFloat(discountValue) || 0;
    if (value <= 0) return 0;

    if (discountType === "percentage") {
      // Discount as percentage of subtotal
      return (subtotalAmount * value) / 100;
    } else {
      // Discount as fixed amount (cannot exceed subtotal)
      return Math.min(value, subtotalAmount);
    }
  }, [subtotalAmount, discountValue, discountType]);

  // Calculate amount after discount
  const amountAfterDiscount = useMemo(() => {
    return subtotalAmount - discountAmount;
  }, [subtotalAmount, discountAmount]);

  // Calculate tax (10% for now - can be made configurable)
  const taxRate = 0.1;
  const taxAmount = useMemo(() => {
    // Tax is calculated on amount after discount
    return amountAfterDiscount * taxRate;
  }, [amountAfterDiscount]);

  // Calculate total
  const totalAmount = useMemo(() => {
    return amountAfterDiscount + taxAmount;
  }, [amountAfterDiscount, taxAmount]);

  // Handle form submit
  const handleSubmit = async () => {
    if (!selectedEventId || selectedTickets.length === 0) {
      return;
    }

    const data: CreateBookingTransactionData = {
      customerId: selectedCustomerId || undefined,
      eventId: selectedEventId,
      tickets: selectedTickets,
    };

    setPendingData(data);
    setShowConfirmDialog(true);
  };

  // Handle confirm submit
  const handleConfirmSubmit = async () => {
    if (!pendingData) return;

    setIsSubmitting(true);
    try {
      // Transform the transaction data to CreateBookingInput format
      const bookingInput: CreateBookingInput = {
        event_id: pendingData.eventId,
        customer_id: pendingData.customerId || undefined,
        items: pendingData.tickets.map((ticket) => ({
          event_seat_id: ticket.eventSeatId,
          section_name: ticket.sectionName,
          row_name: ticket.rowName,
          seat_number: ticket.seatNumber,
          unit_price: ticket.ticketPrice || 0,
          total_price: ticket.ticketPrice || 0,
          currency: "USD",
          ticket_number: ticket.ticketNumber,
          ticket_status: ticket.status,
        })),
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        tax_rate: 0.1, // 10% tax
        currency: "USD",
      };

      await onSubmit(bookingInput);
      setPendingData(null);
      setShowConfirmDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating booking:", error);
      setShowConfirmDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowConfirmDialog(false);
    setPendingData(null);
    onOpenChange(false);
  };

  const confirmAction = {
    label: isSubmitting ? "Creating..." : "Confirm & Create",
    onClick: handleConfirmSubmit,
    loading: isSubmitting,
    disabled: isSubmitting,
    variant: "default" as const,
  };

  const cancelAction = {
    label: "Cancel",
    variant: "outline" as const,
    disabled: isSubmitting,
  };

  return (
    <>
      <FullScreenDialog
        open={open}
        onClose={handleClose}
        title={title}
        maxWidth={maxWidth}
        loading={isSubmitting}
        showSubmitButton
        onSubmit={handleSubmit}
        onCancel={handleClose}
      >
        <div
          className={cn(
            "flex gap-6 h-[calc(100vh-200px)]",
            density.paddingForm
          )}
        >
          {/* Left Section - Seat Selection */}
          <div className="flex-1 flex flex-col min-w-0 border rounded-lg bg-background">
            {/* Header with Show/Event Selectors and View Toggle */}
            <div className="p-4 border-b space-y-4 flex-shrink-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Show</label>
                  <Popover
                    open={showPopoverOpen}
                    onOpenChange={setShowPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedShowId
                          ? shows.find((s) => s.id === selectedShowId)?.name ||
                            shows.find((s) => s.id === selectedShowId)?.code ||
                            "Select a show"
                          : "Select a show"}
                        <svg
                          className="ml-2 h-4 w-4 shrink-0 opacity-50"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search shows..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No shows found.</CommandEmpty>
                          <CommandGroup>
                            {shows.map((show) => (
                              <CommandItem
                                key={show.id}
                                value={`${show.name || show.code} ${show.code || ""}`}
                                onSelect={() => {
                                  setSelectedShowId(show.id);
                                  setSelectedEventId(null); // Reset event when show changes
                                  setShowPopoverOpen(false); // Close popover after selection
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {show.name || show.code}
                                  </span>
                                  {show.code && show.name && (
                                    <span className="text-xs text-muted-foreground">
                                      {show.code}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event</label>
                  <Popover
                    open={eventPopoverOpen}
                    onOpenChange={setEventPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                        disabled={!selectedShowId}
                      >
                        {selectedEventId
                          ? (() => {
                              const event = events.find(
                                (e) => e.id === selectedEventId
                              );
                              return event
                                ? `${event.title} - ${new Date(
                                    event.start_dt
                                  ).toLocaleDateString()}`
                                : "Select an event";
                            })()
                          : "Select an event"}
                        <svg
                          className="ml-2 h-4 w-4 shrink-0 opacity-50"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search events..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No events found.</CommandEmpty>
                          <CommandGroup>
                            {events.map((event) => (
                              <CommandItem
                                key={event.id}
                                value={`${event.title} ${new Date(
                                  event.start_dt
                                ).toLocaleDateString()}`}
                                onSelect={() => {
                                  setSelectedEventId(event.id);
                                  setEventPopoverOpen(false); // Close popover after selection
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {event.title}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      event.start_dt
                                    ).toLocaleDateString(undefined, {
                                      weekday: "short",
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Seat Selection View
                </span>
                <Tabs
                  value={seatViewMode}
                  onValueChange={(value) =>
                    setSeatViewMode(value as "visualization" | "list")
                  }
                >
                  <TabsList>
                    <TabsTrigger value="visualization" className="gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      Layout
                    </TabsTrigger>
                    <TabsTrigger value="list" className="gap-2">
                      <List className="h-4 w-4" />
                      List
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Seat Content Area */}
            <div className="flex-1 overflow-hidden">
              {!selectedEventId ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a show and event to view seats
                </div>
              ) : seatViewMode === "visualization" ? (
                layoutWithSeats ? (
                  <div className="h-full overflow-hidden">
                    <EventInventoryViewer
                      layout={layoutWithSeats.layout}
                      layoutSeats={layoutWithSeats.seats}
                      sections={layoutWithSeats.sections}
                      eventSeats={eventSeats}
                      seatStatusMap={seatStatusMap}
                      locationStatusMap={locationStatusMap}
                      imageUrl={layoutWithSeats.layout.image_url}
                      onSeatClick={handleSeatClick}
                      selectedSeatIds={
                        new Set(
                          selectedTickets
                            .map((t) => {
                              // Find the seat ID from layout seats
                              if (t.sectionName && t.rowName && t.seatNumber) {
                                const seat = layoutWithSeats.seats.find(
                                  (s) =>
                                    s.section_name === t.sectionName &&
                                    s.row === t.rowName &&
                                    s.seat_number === t.seatNumber
                                );
                                return seat?.id;
                              }
                              return t.seatId;
                            })
                            .filter(Boolean) as string[]
                        )
                      }
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No layout available for this event
                  </div>
                )
              ) : (
                <div className="h-full overflow-y-auto p-4">
                  <EventSeatList
                    eventSeats={eventSeats}
                    onSeatSelect={handleListSeatSelect}
                    selectedSeatIds={undefined}
                    showSelection={true}
                    onAddToBooking={handleAddSeatsToBooking}
                    showAddToBooking={true}
                    bookedSeatIds={
                      new Set(selectedTickets.map((t) => t.eventSeatId))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Receipt-style Booking Details */}
          <div className="w-96 flex flex-col min-w-0 border rounded-lg bg-background flex-shrink-0 shadow-sm">
            <div className="h-[600px] overflow-y-auto flex flex-col">
              {/* Customer Selection - Receipt Style */}
              <div className="p-4 border-b bg-muted/20 space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                    Customer
                  </label>
                  <Select
                    value={selectedCustomerId || ""}
                    onValueChange={(value) =>
                      setSelectedCustomerId(value || null)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select customer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: Add customer list */}
                      <SelectItem value="none">No customer selected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Discount
                    </Label>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs",
                          discountType === "percentage"
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        %
                      </span>
                      <Switch
                        checked={discountType === "amount"}
                        onCheckedChange={(checked) => {
                          setDiscountType(checked ? "amount" : "percentage");
                          // Reset value when switching
                          setDiscountValue("0");
                        }}
                        className="scale-75"
                      />
                      <span
                        className={cn(
                          "text-xs",
                          discountType === "amount"
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        $
                      </span>
                    </div>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max={discountType === "percentage" ? "100" : undefined}
                    step={discountType === "percentage" ? "0.1" : "0.01"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "percentage" ? "0" : "0.00"}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Receipt Items Section */}
              <div className="flex-1 p-4 space-y-4">
                {selectedTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="font-medium">No tickets selected</p>
                      <p className="text-xs">
                        Select seats from the layout or list
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Receipt Items */}
                    <div className="space-y-0">
                      {selectedTickets.map((ticket, index) => {
                        const location =
                          ticket.sectionName &&
                          ticket.rowName &&
                          ticket.seatNumber
                            ? `${ticket.sectionName} ${ticket.rowName} ${ticket.seatNumber}`
                            : ticket.seatId
                              ? `Seat ${ticket.seatId.slice(0, 8)}`
                              : "Unknown";

                        return (
                          <div
                            key={ticket.eventSeatId}
                            className="group py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors relative"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-mono text-muted-foreground">
                                    #{String(index + 1).padStart(3, "0")}
                                  </span>
                                  <span className="text-sm font-medium truncate">
                                    {location}
                                  </span>
                                </div>
                                {ticket.ticketNumber && (
                                  <p className="text-xs text-muted-foreground">
                                    Ticket: {ticket.ticketNumber}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm font-semibold tabular-nums">
                                  ${ticket.ticketPrice?.toFixed(2) || "0.00"}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTickets((prev) =>
                                      prev.filter(
                                        (t) =>
                                          t.eventSeatId !== ticket.eventSeatId
                                      )
                                    );
                                  }}
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                  aria-label="Remove ticket"
                                  title="Remove ticket"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Receipt Footer - Totals */}
                    <div className="pt-4 mt-auto border-t space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-semibold tabular-nums">
                          ${subtotalAmount.toFixed(2)}
                        </span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Discount
                            {discountType === "percentage"
                              ? ` (${discountValue}%):`
                              : " ($):"}
                          </span>
                          <span className="font-semibold tabular-nums text-green-600">
                            -${discountAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Tax (10%):
                        </span>
                        <span className="font-semibold tabular-nums">
                          ${taxAmount.toFixed(2)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-base font-bold">
                        <span>TOTAL:</span>
                        <span className="tabular-nums">
                          ${totalAmount.toFixed(2)}
                        </span>
                      </div>
                      {selectedTickets.length > 0 && (
                        <div className="pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTickets([])}
                            className="w-full h-8 text-xs"
                          >
                            Clear All
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </FullScreenDialog>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={(dialogOpen) => {
          setShowConfirmDialog(dialogOpen);
          if (!dialogOpen) {
            setPendingData(null);
          }
        }}
        title="Confirm Booking Creation"
        description={
          pendingData ? (
            <div className="space-y-3">
              <p className={cn("mb-3", density.textSizeSmall)}>
                Are you sure you want to create this booking?
              </p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Event:</span>{" "}
                  {events.find((e) => e.id === pendingData.eventId)?.title ||
                    "N/A"}
                </div>
                <div>
                  <span className="font-medium">Tickets:</span>{" "}
                  {pendingData.tickets.length}
                </div>
                <div>
                  <span className="font-medium">Total:</span> $
                  {totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}
