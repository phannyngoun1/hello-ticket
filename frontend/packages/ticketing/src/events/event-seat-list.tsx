/**
 * Event Seat List Component
 *
 * Displays event seats using Item components for management
 */

import { useState, useMemo } from "react";
import {
  Button,
  Badge,
  Input,
  Checkbox,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@truths/ui";
import {
  RefreshCw,
  Search,
  Trash2,
  X,
  Filter,
  Ticket,
  Check,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { ConfirmationDialog } from "@truths/custom-ui";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@truths/ui";
import type { EventSeat, EventSeatStatus } from "./types";
import { EventSeatStatus as EventSeatStatusEnum } from "./types";

export interface EventSeatListProps {
  eventSeats: EventSeat[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onDelete?: (seatIds: string[]) => void;
  onDeleteSeat?: (seatId: string) => void;
  onCreateTickets?: (seatIds: string[], ticketPrice: number) => void;
  className?: string;
  onSeatSelect?: (eventSeat: EventSeat, checked: boolean) => void;
  selectedSeatIds?: Set<string>;
  showSelection?: boolean;
  onAddToBooking?: (seatIds: string[]) => void;
  showAddToBooking?: boolean;
  bookedSeatIds?: Set<string>; // Seats already in booking list
}

export function EventSeatList({
  eventSeats,
  isLoading = false,
  onRefresh,
  onDelete,
  onDeleteSeat,
  onCreateTickets,
  className,
  onSeatSelect,
  selectedSeatIds: externalSelectedSeatIds,
  showSelection = true,
  onAddToBooking,
  showAddToBooking = false,
  bookedSeatIds = new Set(),
}: EventSeatListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<EventSeatStatus>>(
    new Set()
  );
  const [sectionFilter, setSectionFilter] = useState<Set<string>>(new Set());
  const [sectionSearchQuery, setSectionSearchQuery] = useState("");
  const [statusSearchQuery, setStatusSearchQuery] = useState("");
  const [internalSelectedSeatIds, setInternalSelectedSeatIds] = useState<
    Set<string>
  >(new Set());

  // When showAddToBooking is true, always use internal selection state
  // Otherwise, use external if provided, or internal state
  const selectedSeatIds = showAddToBooking
    ? internalSelectedSeatIds
    : externalSelectedSeatIds !== undefined
      ? externalSelectedSeatIds
      : internalSelectedSeatIds;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingTickets, setIsCreatingTickets] = useState(false);
  const [ticketPriceDialogOpen, setTicketPriceDialogOpen] = useState(false);
  const [ticketPrice, setTicketPrice] = useState<string>("0");
  const [seatsForTicketCreation, setSeatsForTicketCreation] = useState<
    string[]
  >([]);

  // Get unique sections from event seats
  const sections = useMemo(() => {
    const sectionSet = new Set<string>();
    eventSeats.forEach((seat) => {
      if (seat.section_name) {
        sectionSet.add(seat.section_name);
      }
    });
    return Array.from(sectionSet).sort();
  }, [eventSeats]);

  // Status options for multi-select (constant, defined outside useMemo)
  const statusOptions: { label: string; value: EventSeatStatus }[] = useMemo(
    () => [
      {
        label: EventSeatStatusEnum.AVAILABLE,
        value: EventSeatStatusEnum.AVAILABLE,
      },
      {
        label: EventSeatStatusEnum.RESERVED,
        value: EventSeatStatusEnum.RESERVED,
      },
      { label: EventSeatStatusEnum.SOLD, value: EventSeatStatusEnum.SOLD },
      { label: EventSeatStatusEnum.HELD, value: EventSeatStatusEnum.HELD },
      {
        label: EventSeatStatusEnum.BLOCKED,
        value: EventSeatStatusEnum.BLOCKED,
      },
    ],
    []
  );

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!sectionSearchQuery.trim()) {
      return sections;
    }
    const query = sectionSearchQuery.toLowerCase();
    return sections.filter((section) => section.toLowerCase().includes(query));
  }, [sections, sectionSearchQuery]);

  // Filter status options by search query
  const filteredStatusOptions = useMemo(() => {
    if (!statusSearchQuery.trim()) {
      return statusOptions;
    }
    const query = statusSearchQuery.toLowerCase();
    return statusOptions.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [statusOptions, statusSearchQuery]);

  // Filter seats by status, section, and search query
  const filteredSeats = useMemo(() => {
    return eventSeats.filter((seat) => {
      // Filter by status (if any statuses are selected)
      if (statusFilter.size > 0 && !statusFilter.has(seat.status)) {
        return false;
      }

      // Filter by section (if any sections are selected)
      if (
        sectionFilter.size > 0 &&
        seat.section_name &&
        !sectionFilter.has(seat.section_name)
      ) {
        return false;
      }

      // Filter by search query
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        seat.section_name?.toLowerCase().includes(query) ||
        seat.row_name?.toLowerCase().includes(query) ||
        seat.seat_number?.toLowerCase().includes(query) ||
        seat.ticket_number?.toLowerCase().includes(query) ||
        false
      );
    });
  }, [eventSeats, statusFilter, sectionFilter, searchQuery]);

  const handleStatusToggle = (status: EventSeatStatus) => {
    const newFilter = new Set(statusFilter);
    if (newFilter.has(status)) {
      newFilter.delete(status);
    } else {
      newFilter.add(status);
    }
    setStatusFilter(newFilter);
  };

  const handleClearStatusFilter = () => {
    setStatusFilter(new Set());
  };

  const handleSectionToggle = (section: string) => {
    const newFilter = new Set(sectionFilter);
    if (newFilter.has(section)) {
      newFilter.delete(section);
    } else {
      newFilter.add(section);
    }
    setSectionFilter(newFilter);
  };

  const handleClearSectionFilter = () => {
    setSectionFilter(new Set());
  };

  // Group filtered seats by section
  const seatsBySection = useMemo(() => {
    const grouped = new Map<string, EventSeat[]>();
    filteredSeats.forEach((seat) => {
      const section = seat.section_name || "Unknown Section";
      if (!grouped.has(section)) {
        grouped.set(section, []);
      }
      grouped.get(section)!.push(seat);
    });
    // Sort sections alphabetically
    const sortedSections = Array.from(grouped.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    return sortedSections;
  }, [filteredSeats]);

  // Get status color for visual indicator (border/background)
  const getStatusColor = (seat: EventSeat): string => {
    // Check ticket status first (takes priority)
    if (seat.ticket_status) {
      const statusUpper = String(seat.ticket_status).toUpperCase().trim();
      switch (statusUpper) {
        case "AVAILABLE":
          return "border-l-4 border-l-green-500";
        case "RESERVED":
          return "border-l-4 border-l-yellow-500";
        case "CONFIRMED":
          return "border-l-4 border-l-blue-500";
        case "CANCELLED":
          return "border-l-4 border-l-red-500";
        case "USED":
          return "border-l-4 border-l-gray-500";
        case "TRANSFERRED":
          return "border-l-4 border-l-purple-500";
        default:
          break;
      }
    }

    // Fall back to event-seat status
    const statusUpper = String(seat.status).toUpperCase().trim();
    switch (statusUpper) {
      case "AVAILABLE":
        return "border-l-4 border-l-green-500";
      case "RESERVED":
        return "border-l-4 border-l-yellow-500";
      case "SOLD":
        return "border-l-4 border-l-blue-500";
      case "HELD":
        return "border-l-4 border-l-purple-500";
      case "BLOCKED":
        return "border-l-4 border-l-red-500";
      default:
        return "border-l-4 border-l-gray-500";
    }
  };

  // Check if seat is available for selection/booking
  const isSeatAvailable = (seat: EventSeat): boolean => {
    // Check ticket status first (takes priority)
    if (seat.ticket_status) {
      const statusUpper = String(seat.ticket_status).toUpperCase().trim();
      return statusUpper === "AVAILABLE";
    }

    // Fall back to event-seat status
    const statusUpper = String(seat.status).toUpperCase().trim();
    return statusUpper === "AVAILABLE";
  };

  const getStatusBadge = (status: EventSeatStatus, ticketStatus?: string) => {
    // Use ticket status if available, otherwise use event-seat status
    const displayStatus = ticketStatus || status;
    const statusUpper = String(displayStatus).toUpperCase().trim();

    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      AVAILABLE: "outline",
      RESERVED: "outline",
      SOLD: "default",
      CONFIRMED: "default",
      CANCELLED: "destructive",
      USED: "secondary",
      TRANSFERRED: "outline",
      HELD: "outline",
      BLOCKED: "destructive",
    };

    const colors: Record<string, string> = {
      AVAILABLE: "bg-green-50 text-green-700 border-green-200",
      RESERVED: "bg-yellow-50 text-yellow-700 border-yellow-200",
      SOLD: "bg-blue-50 text-blue-700 border-blue-200",
      CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
      CANCELLED: "bg-red-50 text-red-700 border-red-200",
      USED: "bg-gray-50 text-gray-700 border-gray-200",
      TRANSFERRED: "bg-purple-50 text-purple-700 border-purple-200",
      HELD: "bg-purple-50 text-purple-700 border-purple-200",
      BLOCKED: "bg-red-50 text-red-700 border-red-200",
    };

    return (
      <Badge
        variant={variants[statusUpper] || "outline"}
        className={
          colors[statusUpper] || "bg-gray-50 text-gray-700 border-gray-200"
        }
      >
        {displayStatus}
      </Badge>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (showAddToBooking) {
      // When in booking mode, use internal selection
      // Only select seats that are not already booked
      if (checked) {
        const selectableSeats = filteredSeats
          .filter((seat) => !bookedSeatIds.has(seat.id))
          .map((seat) => seat.id);
        setInternalSelectedSeatIds(new Set(selectableSeats));
      } else {
        setInternalSelectedSeatIds(new Set());
      }
    } else if (externalSelectedSeatIds !== undefined) {
      // External control - notify parent
      filteredSeats.forEach((seat) => {
        // Only select seats that are not already booked
        if (!bookedSeatIds.has(seat.id) && onSeatSelect) {
          onSeatSelect(seat, checked);
        }
      });
    } else {
      // Internal control
      if (checked) {
        const selectableSeats = filteredSeats
          .filter((seat) => !bookedSeatIds.has(seat.id))
          .map((seat) => seat.id);
        setInternalSelectedSeatIds(new Set(selectableSeats));
      } else {
        setInternalSelectedSeatIds(new Set());
      }
    }
  };

  const handleSelectSeat = (seat: EventSeat, checked: boolean) => {
    // Don't allow selecting seats that are not available or already booked
    if (!isSeatAvailable(seat) || bookedSeatIds.has(seat.id)) {
      return;
    }

    if (showAddToBooking) {
      // When in booking mode, use internal selection
      const newSelected = new Set(internalSelectedSeatIds);
      if (checked) {
        newSelected.add(seat.id);
      } else {
        newSelected.delete(seat.id);
      }
      setInternalSelectedSeatIds(newSelected);
    } else if (onSeatSelect) {
      onSeatSelect(seat, checked);
    } else if (externalSelectedSeatIds === undefined) {
      // Internal control only if no external control
      const newSelected = new Set(internalSelectedSeatIds);
      if (checked) {
        newSelected.add(seat.id);
      } else {
        newSelected.delete(seat.id);
      }
      setInternalSelectedSeatIds(newSelected);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedSeatIds.size > 0) {
      setDeleteConfirmOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedSeatIds.size === 0) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(Array.from(selectedSeatIds));
      } else if (onDeleteSeat && selectedSeatIds.size === 1) {
        await onDeleteSeat(Array.from(selectedSeatIds)[0]);
      }
      // Clear selection after deletion
      if (externalSelectedSeatIds === undefined) {
        setInternalSelectedSeatIds(new Set());
      } else if (onSeatSelect) {
        // Clear all selections by unchecking all
        eventSeats.forEach((seat) => {
          if (selectedSeatIds.has(seat.id)) {
            onSeatSelect(seat, false);
          }
        });
      }
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Failed to delete seats:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateTicketsClick = () => {
    if (selectedSeatIds.size === 0 || !onCreateTickets) return;

    // Only create tickets for seats without tickets
    const seatsWithoutTickets = Array.from(selectedSeatIds).filter((seatId) => {
      const seat = eventSeats.find((s) => s.id === seatId);
      return seat && !seat.ticket_number;
    });

    if (seatsWithoutTickets.length === 0) {
      return; // No seats without tickets
    }

    // Store the seats without tickets for the dialog
    setSeatsForTicketCreation(seatsWithoutTickets);
    setTicketPriceDialogOpen(true);
  };

  const handleCreateTicketsConfirm = async () => {
    if (seatsForTicketCreation.length === 0 || !onCreateTickets) return;

    const price = parseFloat(ticketPrice) || 0;
    setIsCreatingTickets(true);
    setTicketPriceDialogOpen(false);
    try {
      await onCreateTickets(seatsForTicketCreation, price);
      // Remove the seats that got tickets from selection
      if (externalSelectedSeatIds === undefined) {
        const newSelection = new Set(internalSelectedSeatIds);
        seatsForTicketCreation.forEach((id) => newSelection.delete(id));
        setInternalSelectedSeatIds(newSelection);
      } else if (onSeatSelect) {
        // Remove seats from external selection
        seatsForTicketCreation.forEach((id) => {
          const seat = eventSeats.find((s) => s.id === id);
          if (seat) {
            onSeatSelect(seat, false);
          }
        });
      }
      setSeatsForTicketCreation([]);
      setTicketPrice("0");
    } catch (error) {
      console.error("Failed to create tickets:", error);
    } finally {
      setIsCreatingTickets(false);
    }
  };


  // Calculate allSelected - only consider selectable seats (available and not already booked)
  const selectableSeats = useMemo(() => {
    return filteredSeats.filter((seat) => {
      // Check ticket status first (takes priority)
      if (seat.ticket_status) {
        const statusUpper = String(seat.ticket_status).toUpperCase().trim();
        if (statusUpper !== "AVAILABLE") return false;
      } else {
        // Fall back to event-seat status
        const statusUpper = String(seat.status).toUpperCase().trim();
        if (statusUpper !== "AVAILABLE") return false;
      }
      // Must not be already booked
      return !bookedSeatIds.has(seat.id);
    });
  }, [filteredSeats, bookedSeatIds]);

  const allSelected =
    selectableSeats.length > 0 &&
    selectedSeatIds.size === selectableSeats.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading seats...</div>
      </div>
    );
  }

  if (eventSeats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">No seats found</p>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 min-w-0", className)}>
      {/* Search, Filter and Actions */}
      <div className="space-y-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative flex-1 min-w-0 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              placeholder="Search by section, row, or seat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 min-w-0"
            />
          </div>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4 min-w-0 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 flex-shrink-0 justify-start gap-1.5"
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="text-xs whitespace-nowrap">
                  {sectionFilter.size === 0
                    ? "All Sections"
                    : sectionFilter.size === 1
                      ? Array.from(sectionFilter)[0]
                      : `${sectionFilter.size} selected`}
                </span>
                {sectionFilter.size > 0 && (
                  <>
                    <Separator orientation="vertical" className="mx-1 h-3" />
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 py-0 text-[10px] font-normal h-4"
                    >
                      {sectionFilter.size}
                    </Badge>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search sections..."
                  value={sectionSearchQuery}
                  onValueChange={setSectionSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>No sections found.</CommandEmpty>
                  <CommandGroup>
                    {filteredSections.map((section) => {
                      const isSelected = sectionFilter.has(section);
                      return (
                        <CommandItem
                          key={section}
                          onSelect={() => handleSectionToggle(section)}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <Check className="h-3 w-3" />
                          </div>
                          <span>{section}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  {sectionFilter.size > 0 && (
                    <>
                      <Separator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={handleClearSectionFilter}
                          className="justify-center text-center"
                        >
                          Clear filters
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 flex-shrink-0 justify-start gap-1.5"
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="text-xs whitespace-nowrap">
                  {statusFilter.size === 0
                    ? "All Status"
                    : statusFilter.size === 1
                      ? Array.from(statusFilter)[0]
                      : `${statusFilter.size} selected`}
                </span>
                {statusFilter.size > 0 && (
                  <>
                    <Separator orientation="vertical" className="mx-1 h-3" />
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 py-0 text-[10px] font-normal h-4"
                    >
                      {statusFilter.size}
                    </Badge>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search statuses..."
                  value={statusSearchQuery}
                  onValueChange={setStatusSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>No statuses found.</CommandEmpty>
                  <CommandGroup>
                    {filteredStatusOptions.map((option) => {
                      const isSelected = statusFilter.has(option.value);
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() => handleStatusToggle(option.value)}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <Check className="h-3 w-3" />
                          </div>
                          <span>{option.label}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  {statusFilter.size > 0 && (
                    <>
                      <Separator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={handleClearStatusFilter}
                          className="justify-center text-center"
                        >
                          Clear filters
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Selection Bars */}
      {selectedSeatIds.size > 0 &&
        (() => {
          // Find selected seats without tickets
          const selectedSeatsWithoutTickets = Array.from(
            selectedSeatIds
          ).filter((seatId) => {
            const seat = eventSeats.find((s) => s.id === seatId);
            return seat && !seat.ticket_number;
          });
          const seatsWithoutTicketsCount = selectedSeatsWithoutTickets.length;
          const hasSeatsWithoutTickets = seatsWithoutTicketsCount > 0;

          return (
            <div className="space-y-2">
              {/* Add to Booking Bar - Show when showAddToBooking is true */}
              {showAddToBooking && onAddToBooking && (
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20 min-w-0">
                  <span className="text-sm font-medium truncate flex-shrink-0 min-w-0">
                    {selectedSeatIds.size} seat
                    {selectedSeatIds.size !== 1 ? "s" : ""} selected
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setInternalSelectedSeatIds(new Set());
                      }}
                      className="h-7 px-2 text-xs"
                      title="Clear selection"
                    >
                      Clear
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        if (onAddToBooking && selectedSeatIds.size > 0) {
                          // Filter out seats already in booking
                          const seatsToAdd = Array.from(selectedSeatIds).filter(
                            (seatId) => !bookedSeatIds.has(seatId)
                          );
                          if (seatsToAdd.length > 0) {
                            onAddToBooking(seatsToAdd);
                            // Clear selection after adding
                            setInternalSelectedSeatIds(new Set());
                          }
                        }
                      }}
                      className="h-7 px-3 gap-1.5"
                      title="Add selected seats to booking"
                      disabled={
                        selectedSeatIds.size === 0 ||
                        Array.from(selectedSeatIds).every((seatId) =>
                          bookedSeatIds.has(seatId)
                        )
                      }
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span className="text-xs">Add to Booking</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Create Tickets Bar - Only for seats without tickets */}
              {hasSeatsWithoutTickets && onCreateTickets && (
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20 min-w-0">
                  <span className="text-sm font-medium truncate flex-shrink-0 min-w-0">
                    {seatsWithoutTicketsCount} seat
                    {seatsWithoutTicketsCount !== 1 ? "s" : ""} without ticket
                    {seatsWithoutTicketsCount !== 1 ? "s" : ""} selected
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleCreateTicketsClick}
                      disabled={isCreatingTickets}
                      className="h-7 px-3 gap-1.5"
                      title="Create tickets for selected seats without tickets"
                    >
                      <Ticket
                        className={cn(
                          "h-3.5 w-3.5",
                          isCreatingTickets && "animate-spin"
                        )}
                      />
                      <span className="text-xs">Create Tickets</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Delete Action Bar - For all selected seats */}
              {!showAddToBooking && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border min-w-0">
                  <span className="text-sm font-medium truncate flex-shrink-0 min-w-0">
                    {selectedSeatIds.size} seat
                    {selectedSeatIds.size !== 1 ? "s" : ""} selected
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (externalSelectedSeatIds === undefined) {
                          setInternalSelectedSeatIds(new Set());
                        } else if (onSeatSelect) {
                          // Clear all selections by unchecking all
                          eventSeats.forEach((seat) => {
                            if (selectedSeatIds.has(seat.id)) {
                              onSeatSelect(seat, false);
                            }
                          });
                        }
                      }}
                      className="h-7 w-7 p-0 rounded-r-none border-r-0"
                      title="Clear all selection"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {(onDelete || onDeleteSeat) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteSelected}
                        className="h-7 w-7 p-0 rounded-l-none"
                        title="Delete selected"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      {/* Results Count and Select All */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredSeats.length} of {eventSeats.length} seats
        </div>
        {filteredSeats.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              disabled={selectableSeats.length === 0}
            />
            <label
              htmlFor="select-all"
              className={cn(
                "text-sm text-muted-foreground",
                selectableSeats.length > 0 && "cursor-pointer"
              )}
            >
              Select all
            </label>
          </div>
        )}
      </div>

      {/* Seat List - Grouped by Section */}
      <div className="space-y-4 min-w-0">
        {seatsBySection.map(([sectionName, seats]) => (
          <div key={sectionName} className="space-y-2">
            {/* Section Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {sectionName}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {seats.length} seat{seats.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            {/* Seats in this section */}
            <div className="space-y-2 pl-2">
              {seats.map((seat) => {
                const location =
                  seat.row_name && seat.seat_number
                    ? `${seat.row_name} ${seat.seat_number}`
                    : seat.seat_id
                      ? `Seat ${seat.seat_id.slice(0, 8)}`
                      : "N/A";

                // Format price display
                const priceDisplay =
                  seat.ticket_price !== undefined && seat.ticket_price !== null
                    ? `Price: $${seat.ticket_price.toFixed(2)}`
                    : null;

                const details = [
                  seat.broker_id && `Broker: ${seat.broker_id}`,
                  seat.ticket_number && `Ticket: ${seat.ticket_number}`,
                  priceDisplay,
                ]
                  .filter(Boolean)
                  .join(" • ");

                const isSelected = selectedSeatIds.has(seat.id);
                const isBooked = bookedSeatIds.has(seat.id);
                const isAvailable = isSeatAvailable(seat);
                const isDisabled = !isAvailable || isBooked;

                return (
                  <Item
                    key={seat.id}
                    onClick={() => {
                      // Don't allow selection if not available or already booked
                      if (!isDisabled) {
                        handleSelectSeat(seat, !isSelected);
                      }
                    }}
                    className={cn(
                      isSelected && "bg-accent/50 border-primary",
                      isDisabled && "opacity-60 cursor-not-allowed",
                      getStatusColor(seat),
                      "min-w-0"
                    )}
                  >
                    {showSelection && (
                      <ItemActions className="flex-shrink-0">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (!isDisabled) {
                              handleSelectSeat(seat, checked as boolean);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={isDisabled}
                        />
                      </ItemActions>
                    )}
                    <ItemContent className="min-w-0">
                      <div className="flex items-start justify-between gap-4 min-w-0">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 mb-1">
                            <ItemTitle className="truncate">
                              {location}
                            </ItemTitle>
                            {getStatusBadge(seat.status, seat.ticket_status)}
                          </div>
                          {details && (
                            <ItemDescription className="truncate">
                              {details}
                            </ItemDescription>
                          )}
                        </div>
                        {showAddToBooking && (
                          <ItemActions className="flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add this individual seat to booking
                                if (onAddToBooking && !isDisabled) {
                                  onAddToBooking([seat.id]);
                                }
                              }}
                              className="h-7 w-7 p-0"
                              aria-label="Add to booking"
                              title={
                                isBooked
                                  ? "Already in booking"
                                  : !isAvailable
                                    ? "Seat not available"
                                    : "Add to booking"
                              }
                              disabled={isDisabled}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </ItemActions>
                        )}
                      </div>
                    </ItemContent>
                  </Item>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Seats"
        description={
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete {selectedSeatIds.size} seat
              {selectedSeatIds.size !== 1 ? "s" : ""}? This action cannot be
              undone.
            </p>
            {selectedSeatIds.size <= 5 && (
              <div className="text-xs text-muted-foreground mt-2">
                <p className="font-medium mb-1">Seats to be deleted:</p>
                <ul className="list-disc list-inside space-y-1">
                  {Array.from(selectedSeatIds).map((seatId) => {
                    const seat = eventSeats.find((s) => s.id === seatId);
                    const location = seat
                      ? seat.section_name && seat.row_name && seat.seat_number
                        ? `${seat.section_name} ${seat.row_name} ${seat.seat_number}`
                        : seat.seat_id
                          ? `Seat ${seat.seat_id.slice(0, 8)}`
                          : seatId
                      : seatId;
                    return <li key={seatId}>{location}</li>;
                  })}
                </ul>
              </div>
            )}
          </div>
        }
        confirmText="delete"
        confirmTextLabel="Type 'delete' to confirm"
        confirmTextPlaceholder="delete"
        confirmAction={{
          label: "Delete",
          type: "delete",
          variant: "destructive",
          onClick: handleConfirmDelete,
          loading: isDeleting,
          disabled: isDeleting,
        }}
        cancelAction={{
          label: "Cancel",
          onClick: () => setDeleteConfirmOpen(false),
          disabled: isDeleting,
        }}
      />

      {/* Ticket Price Dialog */}
      <ConfirmationDialog
        open={ticketPriceDialogOpen}
        onOpenChange={(open) => {
          setTicketPriceDialogOpen(open);
          if (!open) {
            setTicketPrice("0");
            setSeatsForTicketCreation([]);
          }
        }}
        title="Create Tickets"
        description={
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create tickets for {seatsForTicketCreation.length} selected seat
              {seatsForTicketCreation.length !== 1 ? "s" : ""} without tickets.
            </p>
            <div className="space-y-2">
              <Label htmlFor="ticket-price-input">
                Ticket Price (per ticket)
              </Label>
              <Input
                id="ticket-price-input"
                type="number"
                step="0.01"
                min="0"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                placeholder="0.00"
                disabled={isCreatingTickets}
              />
              <p className="text-xs text-muted-foreground">
                This price will be applied to all tickets. You can change
                individual ticket prices later.
              </p>
            </div>
          </div>
        }
        confirmAction={{
          label: "Create Tickets",
          variant: "default",
          onClick: handleCreateTicketsConfirm,
          loading: isCreatingTickets,
          disabled: isCreatingTickets,
        }}
        cancelAction={{
          label: "Cancel",
          onClick: () => {
            setTicketPriceDialogOpen(false);
            setTicketPrice("0");
            setSeatsForTicketCreation([]);
          },
          disabled: isCreatingTickets,
        }}
      />
    </div>
  );
}
