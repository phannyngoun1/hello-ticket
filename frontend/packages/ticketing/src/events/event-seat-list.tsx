/**
 * Event Seat List Component
 *
 * Displays event seats using Item components for management
 */

import { useState, useMemo, useEffect } from "react";
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
  Filter,
  Ticket,
  Check,
  Plus,
  ShoppingCart,
  Ban,
  Pause,
  Play,
  Calendar,
} from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { ConfirmationDialog, ButtonTabs } from "@truths/custom-ui";
import { HoldBlockSeatsDialog } from "./hold-block-seats-dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@truths/ui";
import type { EventSeat, EventSeatStatus } from "./types";

export interface EventSeatListProps {
  eventSeats: EventSeat[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onDelete?: (seatIds: string[]) => void;
  onDeleteSeat?: (seatId: string) => void;
  onCreateTickets?: (seatIds: string[], ticketPrice: number) => void;
  onHoldSeats?: (seatIds: string[], reason?: string) => void;
  onUnholdSeats?: (seatIds: string[]) => void;
  onUnblockSeats?: (seatIds: string[]) => void;
  onBlockSeats?: (seatIds: string[], reason?: string) => void;
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
  onHoldSeats,
  onUnholdSeats,
  onUnblockSeats,
  onBlockSeats,
  className,
  onSeatSelect,
  selectedSeatIds: externalSelectedSeatIds,
  showSelection = true,
  onAddToBooking,
  showAddToBooking = false,
  bookedSeatIds = new Set(),
}: EventSeatListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<EventSeatStatus>(
    "available" as EventSeatStatus
  );
  const [sectionFilter, setSectionFilter] = useState<Set<string>>(new Set());

  // Tab configuration for each status
  const statusTabs = [
    { value: "available" as EventSeatStatus, label: "Available", icon: Check },
    { value: "reserved" as EventSeatStatus, label: "Reserved", icon: Calendar },
    { value: "held" as EventSeatStatus, label: "Held", icon: Pause },
    { value: "blocked" as EventSeatStatus, label: "Blocked", icon: Ban },
    { value: "sold" as EventSeatStatus, label: "Sold", icon: Ticket },
  ];
  const [sectionSearchQuery, setSectionSearchQuery] = useState("");
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

  // Clear selection when tab changes
  useEffect(() => {
    if (externalSelectedSeatIds === undefined) {
      setInternalSelectedSeatIds(new Set());
    } else if (onSeatSelect) {
      // Clear all selections by unchecking all currently selected seats
      eventSeats.forEach((seat) => {
        if (selectedSeatIds.has(seat.id)) {
          onSeatSelect(seat, false);
        }
      });
    }
  }, [activeTab]);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingTickets, setIsCreatingTickets] = useState(false);
  const [ticketPriceDialogOpen, setTicketPriceDialogOpen] = useState(false);
  const [ticketPrice, setTicketPrice] = useState<string>("0");
  const [seatsForTicketCreation, setSeatsForTicketCreation] = useState<
    string[]
  >([]);
  const [holdBlockDialogOpen, setHoldBlockDialogOpen] = useState(false);
  const [holdBlockAction, setHoldBlockAction] = useState<
    "hold" | "unhold" | "unblock" | "block"
  >("hold");
  const [isHoldingBlocking, setIsHoldingBlocking] = useState(false);

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

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!sectionSearchQuery.trim()) {
      return sections;
    }
    const query = sectionSearchQuery.toLowerCase();
    return sections.filter((section) => section.toLowerCase().includes(query));
  }, [sections, sectionSearchQuery]);

  // Filter seats by status, section, and search query
  const filteredSeats = useMemo(() => {
    return eventSeats.filter((seat) => {
      // Filter by active tab status
      if (seat.status !== activeTab) {
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
  }, [eventSeats, activeTab, sectionFilter, searchQuery]);

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

  // Check if seat can be held/blocked (must be available and not already held/blocked)
  const canSeatBeHeldOrBlocked = (seat: EventSeat): boolean => {
    // Check seat status first - if already held or blocked, cannot be held/blocked again
    const seatStatusUpper = String(seat.status).toUpperCase().trim();
    if (seatStatusUpper === "HELD" || seatStatusUpper === "BLOCKED") {
      return false;
    }

    // Check ticket status - seat must be available
    if (seat.ticket_status) {
      const ticketStatusUpper = String(seat.ticket_status).toUpperCase().trim();
      return ticketStatusUpper === "AVAILABLE";
    }

    // Fall back to event-seat status
    return seatStatusUpper === "AVAILABLE";
  };

  const getStatusBadge = (status: EventSeatStatus, ticketStatus?: string) => {
    // For held or blocked seats, always show the seat status (takes precedence over ticket status)
    // For other seats, use ticket status if available, otherwise use event-seat status
    const displayStatus =
      status === "held" || status === "blocked"
        ? status
        : ticketStatus || status;
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
      // Only select seats that are available and not already booked
      if (checked) {
        const selectableSeats = filteredSeats
          .filter(
            (seat) => isSeatAvailable(seat) && !bookedSeatIds.has(seat.id)
          )
          .map((seat) => seat.id);
        setInternalSelectedSeatIds(new Set(selectableSeats));
      } else {
        setInternalSelectedSeatIds(new Set());
      }
    } else if (externalSelectedSeatIds !== undefined) {
      // External control - notify parent
      filteredSeats.forEach((seat) => {
        // Only select seats that are available and not already booked
        if (
          isSeatAvailable(seat) &&
          !bookedSeatIds.has(seat.id) &&
          onSeatSelect
        ) {
          onSeatSelect(seat, checked);
        }
      });
    } else {
      // Internal control
      if (checked) {
        const selectableSeats = filteredSeats
          .filter(
            (seat) => isSeatAvailable(seat) && !bookedSeatIds.has(seat.id)
          )
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
    if (selectedSeatIds.size === 0) return;

    // Filter to only available seats that can be deleted
    const availableSeatIds = Array.from(selectedSeatIds).filter((seatId) => {
      const seat = eventSeats.find((s) => s.id === seatId);
      return seat && seat.status === "available";
    });

    if (availableSeatIds.length === 0) {
      // No available seats selected, show error or do nothing
      return;
    }

    // Update selection to only include available seats
    if (externalSelectedSeatIds === undefined) {
      setInternalSelectedSeatIds(new Set(availableSeatIds));
    } else if (onSeatSelect) {
      // Clear selections for non-available seats
      selectedSeatIds.forEach((seatId) => {
        const seat = eventSeats.find((s) => s.id === seatId);
        if (!seat || seat.status !== "available") {
          const seatObj = eventSeats.find((s) => s.id === seatId);
          if (seatObj) {
            onSeatSelect(seatObj, false);
          }
        }
      });
    }

    setDeleteConfirmOpen(true);
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

  const handleHoldSeatsClick = () => {
    if (selectedSeatIds.size === 0 || !onHoldSeats) return;
    setHoldBlockAction("hold");
    setHoldBlockDialogOpen(true);
  };

  const handleUnholdSeatsClick = () => {
    if (selectedSeatIds.size === 0 || !onUnholdSeats) return;
    setHoldBlockAction("unhold");
    setHoldBlockDialogOpen(true);
  };

  const handleUnblockSeatsClick = () => {
    if (selectedSeatIds.size === 0 || !onUnblockSeats) return;
    setHoldBlockAction("unblock");
    setHoldBlockDialogOpen(true);
  };

  const handleBlockSeatsClick = () => {
    if (selectedSeatIds.size === 0 || !onBlockSeats) return;
    setHoldBlockAction("block");
    setHoldBlockDialogOpen(true);
  };

  const handleHoldBlockConfirm = async (reason?: string) => {
    if (selectedSeatIds.size === 0) return;

    setIsHoldingBlocking(true);
    setHoldBlockDialogOpen(false);
    try {
      const seatIds = Array.from(selectedSeatIds);
      if (holdBlockAction === "hold" && onHoldSeats) {
        await onHoldSeats(seatIds, reason);
      } else if (holdBlockAction === "unhold" && onUnholdSeats) {
        await onUnholdSeats(seatIds);
      } else if (holdBlockAction === "unblock" && onUnblockSeats) {
        await onUnblockSeats(seatIds);
      } else if (holdBlockAction === "block" && onBlockSeats) {
        await onBlockSeats(seatIds, reason);
      }
      // Clear selection after hold/block
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
    } catch (error) {
      console.error(`Failed to ${holdBlockAction} seats:`, error);
    } finally {
      setIsHoldingBlocking(false);
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
      {/* Status Tabs */}
      <ButtonTabs
        tabs={statusTabs}
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as EventSeatStatus)}
        className="mb-4"
      />

      {/* Search, Filter and Actions */}
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
          <Input
            placeholder="Search seats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm min-w-0"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 flex-shrink-0 justify-start gap-1"
            >
              <Filter className="h-3 w-3" />
              <span className="text-[10px] whitespace-nowrap">
                {sectionFilter.size === 0
                  ? "Sections"
                  : sectionFilter.size === 1
                    ? Array.from(sectionFilter)[0].slice(0, 8)
                    : `${sectionFilter.size}`}
              </span>
              {sectionFilter.size > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-sm px-0.5 py-0 text-[9px] font-normal h-3 ml-0.5"
                >
                  {sectionFilter.size}
                </Badge>
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
        {onRefresh && (
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-7 px-2"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Selection Bars */}
      {selectedSeatIds.size > 0 &&
        (() => {
          // Calculate all available actions for selected seats
          const selectedSeatsArray = Array.from(selectedSeatIds);

          // Count different types of seats
          const availableSeats = selectedSeatsArray.filter((seatId) => {
            const seat = eventSeats.find((s) => s.id === seatId);
            return seat && seat.status === "available";
          });

          const seatsWithoutTickets = selectedSeatsArray.filter((seatId) => {
            const seat = eventSeats.find((s) => s.id === seatId);
            return seat && !seat.ticket_number;
          });

          const heldSeats = selectedSeatsArray.filter((seatId) => {
            const seat = eventSeats.find((s) => s.id === seatId);
            return seat && seat.status === "held";
          });

          const blockedSeats = selectedSeatsArray.filter((seatId) => {
            const seat = eventSeats.find((s) => s.id === seatId);
            return seat && seat.status === "blocked";
          });

          const holdableSeats = selectedSeatsArray.filter((seatId) => {
            const seat = eventSeats.find((s) => s.id === seatId);
            return seat && canSeatBeHeldOrBlocked(seat);
          });

          // Determine which actions are available
          const canAddToBooking =
            showAddToBooking && onAddToBooking && selectedSeatIds.size > 0;
          const canCreateTickets =
            onCreateTickets && seatsWithoutTickets.length > 0;
          const canHold = onHoldSeats && holdableSeats.length > 0;
          const canBlock = onBlockSeats && holdableSeats.length > 0;
          const canUnhold = onUnholdSeats && heldSeats.length > 0;
          const canUnblock = onUnblockSeats && blockedSeats.length > 0;
          const canDelete =
            (onDelete || onDeleteSeat) && availableSeats.length > 0;

          // If no actions are available, return null
          if (
            !canAddToBooking &&
            !canCreateTickets &&
            !canHold &&
            !canBlock &&
            !canUnhold &&
            !canUnblock &&
            !canDelete
          ) {
            return null;
          }

          return (
            <div className="space-y-2">
              {/* Merged Action Bar - Shows all applicable actions in one line */}
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20 min-w-0">
                <span className="text-sm font-medium truncate flex-shrink-0 min-w-0">
                  {selectedSeatIds.size} seat
                  {selectedSeatIds.size !== 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  {/* Add to Booking */}
                  {canAddToBooking && (
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
                      className="h-7 w-7 p-0"
                      title={`Add ${selectedSeatIds.size} seat${selectedSeatIds.size !== 1 ? "s" : ""} to booking`}
                      disabled={
                        selectedSeatIds.size === 0 ||
                        Array.from(selectedSeatIds).every((seatId) =>
                          bookedSeatIds.has(seatId)
                        )
                      }
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Create Tickets */}
                  {canCreateTickets && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateTicketsClick}
                      disabled={isCreatingTickets}
                      className="h-7 w-7 p-0"
                      title={`Create tickets for ${seatsWithoutTickets.length} seat${seatsWithoutTickets.length !== 1 ? "s" : ""} without tickets`}
                    >
                      <Ticket
                        className={cn(
                          "h-4 w-4",
                          isCreatingTickets && "animate-spin"
                        )}
                      />
                    </Button>
                  )}

                  {/* Hold/Block Actions */}
                  <div className="flex items-center gap-1">
                    {canHold && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleHoldSeatsClick}
                        disabled={isHoldingBlocking}
                        className="h-7 w-7 p-0 border-orange-300 text-orange-700 hover:bg-orange-100"
                        title={`Hold ${holdableSeats.length} seat${holdableSeats.length !== 1 ? "s" : ""}`}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {canBlock && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBlockSeatsClick}
                        disabled={isHoldingBlocking}
                        className="h-7 w-7 p-0 border-orange-300 text-orange-700 hover:bg-orange-100"
                        title={`Block ${holdableSeats.length} seat${holdableSeats.length !== 1 ? "s" : ""}`}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Unhold/Unblock Actions */}
                  <div className="flex items-center gap-1">
                    {canUnhold && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUnholdSeatsClick}
                        disabled={isHoldingBlocking}
                        className="h-7 w-7 p-0 border-green-300 text-green-700 hover:bg-green-100"
                        title={`Unhold ${heldSeats.length} seat${heldSeats.length !== 1 ? "s" : ""}`}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {canUnblock && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUnblockSeatsClick}
                        disabled={isHoldingBlocking}
                        className="h-7 w-7 p-0 border-blue-300 text-blue-700 hover:bg-blue-100"
                        title={`Unblock ${blockedSeats.length} seat${blockedSeats.length !== 1 ? "s" : ""}`}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Delete Action */}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelected}
                      className="h-7 w-7 p-0"
                      title={`Delete ${availableSeats.length} available seat${availableSeats.length !== 1 ? "s" : ""}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
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
                        {/* Individual seat actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {showAddToBooking && (
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
                          )}

                          {/* Individual hold action */}
                          {!showAddToBooking &&
                            onHoldSeats &&
                            canSeatBeHeldOrBlocked(seat) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Hold this individual seat
                                  setHoldBlockAction("hold");
                                  setHoldBlockDialogOpen(true);
                                  // Set selection to just this seat for the dialog
                                  if (externalSelectedSeatIds === undefined) {
                                    setInternalSelectedSeatIds(
                                      new Set([seat.id])
                                    );
                                  } else if (onSeatSelect) {
                                    // Clear current selection and select only this seat
                                    eventSeats.forEach((s) => {
                                      if (
                                        s.id !== seat.id &&
                                        selectedSeatIds.has(s.id)
                                      ) {
                                        onSeatSelect(s, false);
                                      } else if (
                                        s.id === seat.id &&
                                        !selectedSeatIds.has(s.id)
                                      ) {
                                        onSeatSelect(seat, true);
                                      }
                                    });
                                  }
                                }}
                                className="h-7 w-7 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                aria-label="Hold seat"
                                title="Temporarily hold this seat"
                                disabled={isHoldingBlocking}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            )}

                          {/* Individual unhold action */}
                          {!showAddToBooking &&
                            onUnholdSeats &&
                            seat.status === "held" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Unhold this individual seat
                                  setHoldBlockAction("unhold");
                                  setHoldBlockDialogOpen(true);
                                  // Set selection to just this seat for the dialog
                                  if (externalSelectedSeatIds === undefined) {
                                    setInternalSelectedSeatIds(
                                      new Set([seat.id])
                                    );
                                  } else if (onSeatSelect) {
                                    // Clear current selection and select only this seat
                                    eventSeats.forEach((s) => {
                                      if (
                                        s.id !== seat.id &&
                                        selectedSeatIds.has(s.id)
                                      ) {
                                        onSeatSelect(s, false);
                                      } else if (
                                        s.id === seat.id &&
                                        !selectedSeatIds.has(s.id)
                                      ) {
                                        onSeatSelect(seat, true);
                                      }
                                    });
                                  }
                                }}
                                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                aria-label="Unhold seat"
                                title="Release this held seat"
                                disabled={isHoldingBlocking}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}

                          {/* Individual unblock action */}
                          {!showAddToBooking &&
                            onUnblockSeats &&
                            seat.status === "blocked" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Unblock this individual seat
                                  setHoldBlockAction("unblock");
                                  setHoldBlockDialogOpen(true);
                                  // Set selection to just this seat for the dialog
                                  if (externalSelectedSeatIds === undefined) {
                                    setInternalSelectedSeatIds(
                                      new Set([seat.id])
                                    );
                                  } else if (onSeatSelect) {
                                    // Clear current selection and select only this seat
                                    eventSeats.forEach((s) => {
                                      if (
                                        s.id !== seat.id &&
                                        selectedSeatIds.has(s.id)
                                      ) {
                                        onSeatSelect(s, false);
                                      } else if (
                                        s.id === seat.id &&
                                        !selectedSeatIds.has(s.id)
                                      ) {
                                        onSeatSelect(seat, true);
                                      }
                                    });
                                  }
                                }}
                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                aria-label="Unblock seat"
                                title="Unblock this blocked seat"
                                disabled={isHoldingBlocking}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}

                          {/* Individual block action */}
                          {!showAddToBooking &&
                            onBlockSeats &&
                            canSeatBeHeldOrBlocked(seat) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Block this individual seat
                                  setHoldBlockAction("block");
                                  setHoldBlockDialogOpen(true);
                                  // Set selection to just this seat for the dialog
                                  if (externalSelectedSeatIds === undefined) {
                                    setInternalSelectedSeatIds(
                                      new Set([seat.id])
                                    );
                                  } else if (onSeatSelect) {
                                    // Clear current selection and select only this seat
                                    eventSeats.forEach((s) => {
                                      if (
                                        s.id !== seat.id &&
                                        selectedSeatIds.has(s.id)
                                      ) {
                                        onSeatSelect(s, false);
                                      } else if (
                                        s.id === seat.id &&
                                        !selectedSeatIds.has(s.id)
                                      ) {
                                        onSeatSelect(seat, true);
                                      }
                                    });
                                  }
                                }}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                aria-label="Block seat"
                                title="Permanently block this seat"
                                disabled={isHoldingBlocking}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
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
              Are you sure you want to delete {selectedSeatIds.size} available
              seat
              {selectedSeatIds.size !== 1 ? "s" : ""}? Only available seats can
              be deleted. This action cannot be undone.
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

      {/* Hold/Block Seats Dialog */}
      <HoldBlockSeatsDialog
        isOpen={holdBlockDialogOpen}
        onOpenChange={setHoldBlockDialogOpen}
        availableSeatIds={selectedSeatIds}
        action={holdBlockAction}
        onConfirm={handleHoldBlockConfirm}
        isLoading={isHoldingBlocking}
      />
    </div>
  );
}
