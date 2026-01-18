/**
 * Event Seat List View Only Component
 *
 * Simple read-only display of event seats with filtering.
 * No status tabs, no selection, no actions - just view.
 */

import { useState, useMemo } from "react";
import { Button, Badge, Input, FilterPopover } from "@truths/ui";
import { RefreshCw, Search } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@truths/ui";
import type { EventSeat, EventSeatStatus } from "./types";

export interface EventSeatListViewOnlyProps {
  eventSeats: EventSeat[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function EventSeatListViewOnly({
  eventSeats,
  isLoading = false,
  onRefresh,
  className,
}: EventSeatListViewOnlyProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<Set<string>>(new Set());
  const [sectionSearchQuery, setSectionSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [statusSearchQuery, setStatusSearchQuery] = useState("");

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

  const getDisplayStatus = (
    status: EventSeatStatus,
    ticketStatus?: string
  ): string => {
    return status === "held" || status === "blocked"
      ? status
      : ticketStatus || status;
  };

  const statuses = useMemo(() => {
    const statusSet = new Set<string>();
    eventSeats.forEach((seat) => {
      const displayStatus = getDisplayStatus(seat.status, seat.ticket_status);
      if (displayStatus) {
        statusSet.add(String(displayStatus));
      }
    });
    return Array.from(statusSet).sort((a, b) => a.localeCompare(b));
  }, [eventSeats]);

  const filteredStatuses = useMemo(() => {
    if (!statusSearchQuery.trim()) {
      return statuses;
    }
    const query = statusSearchQuery.toLowerCase();
    return statuses.filter((status) => status.toLowerCase().includes(query));
  }, [statuses, statusSearchQuery]);

  // Filter seats by section and search query (no status filtering)
  const filteredSeats = useMemo(() => {
    return eventSeats.filter((seat) => {
      // Filter by section (if any sections are selected)
      if (
        sectionFilter.size > 0 &&
        seat.section_name &&
        !sectionFilter.has(seat.section_name)
      ) {
        return false;
      }

      if (statusFilter.size > 0) {
        const displayStatus = getDisplayStatus(seat.status, seat.ticket_status);
        if (!displayStatus || !statusFilter.has(String(displayStatus))) {
          return false;
        }
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
  }, [eventSeats, sectionFilter, statusFilter, searchQuery]);

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

  const handleStatusToggle = (status: string) => {
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

  // Get status color for visual indicator
  const getStatusColor = (seat: EventSeat): string => {
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

  const getStatusBadge = (status: EventSeatStatus, ticketStatus?: string) => {
    const displayStatus = getDisplayStatus(status, ticketStatus);
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
      {/* Search and Filter */}
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
        <FilterPopover
          items={filteredSections}
          selectedItems={sectionFilter}
          searchQuery={sectionSearchQuery}
          onSearchQueryChange={setSectionSearchQuery}
          onToggleItem={handleSectionToggle}
          onClear={handleClearSectionFilter}
          label="Sections"
          searchPlaceholder="Search sections..."
          emptyText="No sections found."
        />
        <FilterPopover
          items={filteredStatuses}
          selectedItems={statusFilter}
          searchQuery={statusSearchQuery}
          onSearchQueryChange={setStatusSearchQuery}
          onToggleItem={handleStatusToggle}
          onClear={handleClearStatusFilter}
          label="Status"
          searchPlaceholder="Search status..."
          emptyText="No status found."
        />
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

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredSeats.length} of {eventSeats.length} seats
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

                return (
                  <Item
                    key={seat.id}
                    className={cn(getStatusColor(seat), "min-w-0")}
                  >
                    <ItemContent className="min-w-0">
                      <div className="flex items-start justify-between gap-4 min-w-0">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 mb-1">
                            <ItemTitle className="truncate">{location}</ItemTitle>
                            {getStatusBadge(seat.status, seat.ticket_status)}
                          </div>
                          {details && (
                            <ItemDescription className="truncate">
                              {details}
                            </ItemDescription>
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
    </div>
  );
}
