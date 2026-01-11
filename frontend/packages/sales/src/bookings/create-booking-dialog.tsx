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
  Tabs,
  TabsList,
  TabsTrigger,
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
import { LayoutGrid, List } from "lucide-react";
import { ShowService } from "@truths/ticketing/shows";
import { EventService, EventStatus } from "@truths/ticketing/events";
import { useShows, useEvents } from "@truths/ticketing";
import { useEvent } from "@truths/ticketing/events";
import { LayoutService, useLayoutWithSeats } from "@truths/ticketing/layouts";
import { useEventSeats } from "@truths/ticketing/events";
import { api } from "@truths/api";
import type { EventSeat } from "@truths/ticketing/events/types";
import { CustomerService } from "../customers/customer-service";
import { useCustomers } from "../customers/use-customers";
import { EmployeeService } from "../employees/employee-service";
import { useEmployees } from "../employees/use-employees";
import type { Customer } from "../types";
import type { CreateBookingInput } from "./types";
import { BookingReceipt } from "./components/booking-receipt";
import { BookingSeatSelection } from "./components/booking-seat-selection";
import { BookingTicket } from "./types";



export interface CreateBookingTransactionData {
  customerId?: string;
  salespersonId?: string;
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
  initialShowId?: string | null;
  initialEventId?: string | null;
  initialCustomerId?: string | null;
}

export function CreateBookingDialog({
  open,
  onOpenChange,
  onSubmit,
  title = "Create Booking",
  maxWidth = "95vw",
  initialShowId,
  initialEventId,
  initialCustomerId,
}: CreateBookingDialogProps) {
  const density = useDensityStyles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] =
    useState<CreateBookingTransactionData | null>(null);

  // Show and Event selection
  const [selectedShowId, setSelectedShowId] = useState<string | null>(initialShowId || null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId || null);

  // Popover open states
  const [showPopoverOpen, setShowPopoverOpen] = useState(false);
  const [eventPopoverOpen, setEventPopoverOpen] = useState(false);
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [debouncedCustomerSearchQuery, setDebouncedCustomerSearchQuery] = useState("");

  // Salesperson selection
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string | null>(null);
  const [salespersonPopoverOpen, setSalespersonPopoverOpen] = useState(false);
  const [salespersonSearchQuery, setSalespersonSearchQuery] = useState("");
  const [debouncedSalespersonSearchQuery, setDebouncedSalespersonSearchQuery] = useState("");

  // Seat view mode: 'visualization' | 'list'
  const [seatViewMode, setSeatViewMode] = useState<"visualization" | "list">(
    "visualization"
  );

  // Selected section ID for layout drill-down (preserved across view mode switches)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );

  // Selected tickets
  const [selectedTickets, setSelectedTickets] = useState<BookingTicket[]>([]);

  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    initialCustomerId || null
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

  const customerService = useMemo(
    () =>
      new CustomerService({
        apiClient: api,
        endpoints: {
          customers: "/api/v1/sales/customers",
        },
      }),
    []
  );

  const employeeService = useMemo(
    () =>
      new EmployeeService({
        apiClient: api,
        endpoints: {
          employees: "/api/v1/sales/employees",
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
  // Filter to only show events that are on sale
  const events = (eventsData?.data || []).filter(
    (event) => event.status === EventStatus.ON_SALE
  );

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

  // Debounce customer search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerSearchQuery(customerSearchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [customerSearchQuery]);

  // Debounce salesperson search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSalespersonSearchQuery(salespersonSearchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [salespersonSearchQuery]);

  // Fetch customers with dynamic search
  const { data: customersData } = useCustomers(customerService, {
    filter: {
      search: debouncedCustomerSearchQuery || undefined,
    },
    pagination: {
      page: 1,
      pageSize: 50,
    },
  });
  const customers = customersData?.data || [];

  // Fetch employees
  const { data: employeesData } = useEmployees(employeeService, {
    filter: {
        search: debouncedSalespersonSearchQuery || undefined,
    },
    pagination: {
        page: 1,
        pageSize: 50,
    },
  });
  const employees = employeesData?.data || [];


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
      // Clear selected tickets and section when event changes
      setSelectedTickets([]);
      setSelectedSectionId(null);
    }
  }, [selectedEventId]);

  // Reset or Initialize form when dialog open state changes
  useEffect(() => {
    if (!open) {
      setSelectedShowId(null);
      setSelectedEventId(null);
      setSelectedTickets([]);
      setSelectedCustomerId(null);
      setSelectedSalespersonId(null);
      setSeatViewMode("visualization");
      setSelectedSectionId(null);
      setPendingData(null);
      setShowConfirmDialog(false);
      setCustomerSearchQuery("");
      setCustomerPopoverOpen(false);
      setSalespersonSearchQuery("");
      setSalespersonPopoverOpen(false);
    } else {
      // When opening, initialize with props if provided
      if (initialShowId) setSelectedShowId(initialShowId);
      if (initialEventId) setSelectedEventId(initialEventId);
      if (initialCustomerId) setSelectedCustomerId(initialCustomerId);
    }
  }, [open, initialShowId, initialEventId, initialCustomerId]);

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

    // Validate that the selected event is still on sale
    const selectedEvent = events.find((e) => e.id === selectedEventId);
    if (!selectedEvent || selectedEvent.status !== EventStatus.ON_SALE) {
      alert("The selected event is no longer available for booking. Please select a different event.");
      return;
    }

    const data: CreateBookingTransactionData = {
      customerId: selectedCustomerId || undefined,
      salespersonId: selectedSalespersonId || undefined,
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
        salesperson_id: pendingData.salespersonId || undefined,
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
            "flex h-full",
            density.paddingForm
          )}
        >
          {/* Left Section - Seat Selection */}
          <div className="flex-1 flex flex-col min-w-0 ">
            {/* Header with Show/Event Selectors and View Toggle */}
            <div className="pr-1 border-b flex items-center gap-3 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <Popover
                  open={showPopoverOpen}
                  onOpenChange={setShowPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-9"
                    >
                      <span className="truncate">
                        {selectedShowId
                          ? shows.find((s) => s.id === selectedShowId)?.name ||
                            shows.find((s) => s.id === selectedShowId)?.code ||
                            "Select a show"
                          : "Select a show"}
                      </span>
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

              <div className="flex-1 min-w-0">
                <Popover
                  open={eventPopoverOpen}
                  onOpenChange={setEventPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-9"
                      disabled={!selectedShowId}
                    >
                      <span className="truncate">
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
                          : "Select an on-sale event"}
                      </span>
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
                        placeholder="Search on-sale events..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No on-sale events found.</CommandEmpty>
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

              {/* View Mode Toggle */}
              <Tabs
                value={seatViewMode}
                onValueChange={(value) =>
                  setSeatViewMode(value as "visualization" | "list")
                }
              >
                <TabsList>
                  <TabsTrigger value="visualization" className="h-9 w-9 p-0">
                    <LayoutGrid className="h-4 w-4" />
                    <span className="sr-only">Layout</span>
                  </TabsTrigger>
                  <TabsTrigger value="list" className="h-9 w-9 p-0">
                    <List className="h-4 w-4" />
                    <span className="sr-only">List</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Seat Content Area */}
            <BookingSeatSelection
              selectedEventId={selectedEventId}
              seatViewMode={seatViewMode}
              layoutWithSeats={layoutWithSeats}
              eventSeats={eventSeats}
              seatStatusMap={seatStatusMap}
              locationStatusMap={locationStatusMap}
              onSeatClick={handleSeatClick}
              selectedTickets={selectedTickets}
              selectedSectionId={selectedSectionId}
              onSelectedSectionIdChange={setSelectedSectionId}
              onListSeatSelect={handleListSeatSelect}
              onAddSeatsToBooking={handleAddSeatsToBooking}
            />
          </div>

          {/* Right Section - Receipt-style Booking Details */}
          <div className="w-96 flex flex-col min-w-0 border rounded-xl bg-card flex-shrink-0 shadow-lg ml-6">
            <div className="h-full overflow-y-auto flex flex-col">
              {/* Customer Selection - Receipt Style */}
              <BookingReceipt
                // Customer Props
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                onSelectedCustomerIdChange={setSelectedCustomerId}
                customerPopoverOpen={customerPopoverOpen}
                onCustomerPopoverOpenChange={setCustomerPopoverOpen}
                customerSearchQuery={customerSearchQuery}
                onCustomerSearchQueryChange={setCustomerSearchQuery}

                // Salesperson Props
                employees={employees}
                selectedSalespersonId={selectedSalespersonId}
                onSelectedSalespersonIdChange={setSelectedSalespersonId}
                salespersonPopoverOpen={salespersonPopoverOpen}
                onSalespersonPopoverOpenChange={setSalespersonPopoverOpen}
                salespersonSearchQuery={salespersonSearchQuery}
                onSalespersonSearchQueryChange={setSalespersonSearchQuery}

                // Discount Props
                discountType={discountType}
                onDiscountTypeChange={setDiscountType}
                discountValue={discountValue}
                onDiscountValueChange={setDiscountValue}

                // Existing Props
                selectedTickets={selectedTickets}
                onRemoveTicket={(id) => {
                  setSelectedTickets((prev) =>
                    prev.filter((t) => t.eventSeatId !== id)
                  );
                }}
                onClearAll={() => setSelectedTickets([])}
                subtotalAmount={subtotalAmount}
                discountAmount={discountAmount}
                taxAmount={taxAmount}
                totalAmount={totalAmount}
              />
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
