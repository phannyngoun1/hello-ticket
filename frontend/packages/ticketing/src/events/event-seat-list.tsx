/**
 * Event Seat List Component
 *
 * Displays event seats using Item components for management
 */

import { useState } from "react";
import {
  Button,
  Badge,
  Input,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@truths/ui";
import { RefreshCw, Search, Trash2, X, Filter } from "lucide-react";
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
  className?: string;
}

export function EventSeatList({
  eventSeats,
  isLoading = false,
  onRefresh,
  onDelete,
  onDeleteSeat,
  className,
}: EventSeatListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventSeatStatus | "all">(
    "all"
  );
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(
    new Set()
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredSeats = eventSeats.filter((seat) => {
    // Filter by status
    if (statusFilter !== "all" && seat.status !== statusFilter) {
      return false;
    }

    // Filter by search query
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
    const variants: Record<
      EventSeatStatus,
      "default" | "secondary" | "destructive" | "outline"
    > = {
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSeatIds(new Set(filteredSeats.map((seat) => seat.id)));
    } else {
      setSelectedSeatIds(new Set());
    }
  };

  const handleSelectSeat = (seatId: string, checked: boolean) => {
    const newSelected = new Set(selectedSeatIds);
    if (checked) {
      newSelected.add(seatId);
    } else {
      newSelected.delete(seatId);
    }
    setSelectedSeatIds(newSelected);
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
      setSelectedSeatIds(new Set());
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Failed to delete seats:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const allSelected =
    filteredSeats.length > 0 && selectedSeatIds.size === filteredSeats.length;
  const someSelected =
    selectedSeatIds.size > 0 && selectedSeatIds.size < filteredSeats.length;

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
      <div className="flex items-center gap-4 min-w-0 flex-wrap">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            placeholder="Search by section, row, seat, or ticket code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 min-w-0"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as EventSeatStatus | "all")
          }
        >
          <SelectTrigger className="w-[150px] flex-shrink-0">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={EventSeatStatusEnum.AVAILABLE}>
              {EventSeatStatusEnum.AVAILABLE}
            </SelectItem>
            <SelectItem value={EventSeatStatusEnum.RESERVED}>
              {EventSeatStatusEnum.RESERVED}
            </SelectItem>
            <SelectItem value={EventSeatStatusEnum.SOLD}>
              {EventSeatStatusEnum.SOLD}
            </SelectItem>
            <SelectItem value={EventSeatStatusEnum.HELD}>
              {EventSeatStatusEnum.HELD}
            </SelectItem>
            <SelectItem value={EventSeatStatusEnum.BLOCKED}>
              {EventSeatStatusEnum.BLOCKED}
            </SelectItem>
          </SelectContent>
        </Select>
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

      {/* Selection Bar */}
      {selectedSeatIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border min-w-0">
          <span className="text-sm font-medium truncate flex-shrink-0 min-w-0">
            {selectedSeatIds.size} seat{selectedSeatIds.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex items-center flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSeatIds(new Set())}
              className="h-7 w-7 p-0 rounded-r-none border-r-0"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={!onDelete && !onDeleteSeat}
              className="h-7 w-7 p-0 rounded-l-none"
              title="Delete selected"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
            />
            <label
              htmlFor="select-all"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Select all
            </label>
          </div>
        )}
      </div>

      {/* Seat List */}
      <div className="space-y-2 min-w-0">
        {filteredSeats.map((seat) => {
          const location =
            seat.section_name && seat.row_name && seat.seat_number
              ? `${seat.section_name} ${seat.row_name} ${seat.seat_number}`
              : seat.seat_id
                ? `Seat ${seat.seat_id.slice(0, 8)}`
                : "N/A";

          const details = [
            formatPrice(seat.price),
            seat.ticket_code && `Ticket: ${seat.ticket_code}`,
            seat.broker_id && `Broker: ${seat.broker_id}`,
          ]
            .filter(Boolean)
            .join(" • ");

          const isSelected = selectedSeatIds.has(seat.id);

          return (
            <Item
              key={seat.id}
              onClick={() => {
                // TODO: Open seat detail/edit dialog
                console.log("Seat clicked:", seat);
              }}
              className={cn(
                isSelected && "bg-accent/50 border-primary",
                "min-w-0"
              )}
            >
              <ItemActions className="flex-shrink-0">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => {
                    handleSelectSeat(seat.id, checked as boolean);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </ItemActions>
              <ItemContent className="min-w-0">
                <div className="flex items-start justify-between gap-4 min-w-0">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <ItemTitle className="truncate">{location}</ItemTitle>
                    {details && (
                      <ItemDescription className="truncate">
                        {details}
                      </ItemDescription>
                    )}
                  </div>
                  <ItemActions className="flex-shrink-0">
                    {getStatusBadge(seat.status)}
                  </ItemActions>
                </div>
              </ItemContent>
            </Item>
          );
        })}
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
    </div>
  );
}
