/**
 * Event Seat List Component
 *
 * Displays event seats in a table format for management
 */

import { useState } from "react";
import { Card, Button, Badge, Input } from "@truths/ui";
import { RefreshCw, Search } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import type { EventSeat, EventSeatStatus } from "./types";
import { EventSeatStatus as EventSeatStatusEnum } from "./types";

export interface EventSeatListProps {
  eventSeats: EventSeat[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function EventSeatList({
  eventSeats,
  isLoading = false,
  onRefresh,
  className,
}: EventSeatListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSeats = eventSeats.filter((seat) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      seat.section_name?.toLowerCase().includes(query) ||
      seat.row_name?.toLowerCase().includes(query) ||
      seat.seat_number?.toLowerCase().includes(query) ||
      seat.ticket_code?.toLowerCase().includes(query) ||
      false
    );
  });

  const getStatusBadge = (status: EventSeatStatus) => {
    const variants: Record<EventSeatStatus, "default" | "secondary" | "destructive" | "outline"> = {
      AVAILABLE: "outline",
      RESERVED: "outline",
      SOLD: "default",
      HELD: "outline",
      BLOCKED: "destructive",
    };

    const colors: Record<EventSeatStatus, string> = {
      AVAILABLE: "bg-green-50 text-green-700 border-green-200",
      RESERVED: "bg-yellow-50 text-yellow-700 border-yellow-200",
      SOLD: "bg-blue-50 text-blue-700 border-blue-200",
      HELD: "bg-purple-50 text-purple-700 border-purple-200",
      BLOCKED: "bg-red-50 text-red-700 border-red-200",
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
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
    <div className={cn("space-y-4", className)}>
      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by section, row, seat, or ticket code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredSeats.length} of {eventSeats.length} seats
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ticket Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Broker ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border">
              {filteredSeats.map((seat) => (
                <tr
                  key={seat.id}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => {
                    // TODO: Open seat detail/edit dialog
                    console.log("Seat clicked:", seat);
                  }}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {seat.section_name && seat.row_name && seat.seat_number
                      ? `${seat.section_name} ${seat.row_name} ${seat.seat_number}`
                      : seat.seat_id
                        ? `Seat ${seat.seat_id.slice(0, 8)}`
                        : "N/A"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(seat.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatPrice(seat.price)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-muted-foreground">
                    {seat.ticket_code || "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-muted-foreground">
                    {seat.broker_id || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

