/**
 * Booking List Component
 *
 * Table view for bookings with configurable columns and actions.
 */

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { X, DollarSign } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { useDensityStyles } from "@truths/utils";
import {
  createActionsColumn,
  createIdentifiedColumn,
  createTextColumn,
  createDateTimeColumn,
  DataTable,
} from "@truths/custom-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Textarea,
  Label,
} from "@truths/ui";
import { Pagination } from "@truths/shared";
import type { Booking } from "./types";

/**
 * Check if a booking status allows payment
 * Payments can only be made for CONFIRMED or RESERVED bookings
 */
function canProcessPayment(status: string): boolean {
  const normalizedStatus = status.toLowerCase().trim();
  return normalizedStatus === "confirmed" || normalizedStatus === "reserved";
}

export interface BookingListProps {
  className?: string;
  bookings?: Booking[];
  loading?: boolean;
  error?: Error | null;
  pagination?: Pagination;
  onBookingClick?: (booking: Booking) => void;
  onCancel?: (booking: Booking, cancellationReason: string) => void;
  onPayment?: (booking: Booking) => void;
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  customActions?: (booking: Booking) => React.ReactNode;
}

export function BookingList({
  className,
  bookings = [],
  loading = false,
  error = null,
  pagination,
  onBookingClick,
  onCancel,
  onPayment,
  onCreate,
  onSearch,
  onPageChange,
  onPageSizeChange,
  customActions,
}: BookingListProps) {
  const density = useDensityStyles();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const getDisplayName = (booking: Booking) => {
    return booking.booking_number || String(booking.id);
  };

  const getInitials = (value: string | undefined) => {
    if (!value) return "?";
    const letters = value.replace(/[^A-Za-z]/g, "");
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    if (value.length >= 2) return value.slice(0, 2).toUpperCase();
    return value.charAt(0).toUpperCase();
  };

  const columns: ColumnDef<Booking>[] = [
    createIdentifiedColumn<Booking>({
      getDisplayName,
      getInitials: (item) => getInitials(item.booking_number),
      header: "Booking Number",
      showAvatar: false,
      onClick: onBookingClick,
      additionalOptions: {
        id: "booking_number",
      },
    }),
    
    createTextColumn<Booking>({
      accessorKey: "customer_id",
      header: "Customer",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {value ?? "-"}
          </span>
        );
      },
    }),
    
    createTextColumn<Booking>({
      accessorKey: "status",
      header: "Status",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {value ?? "-"}
          </span>
        );
      },
    }),
    
    createTextColumn<Booking>({
      accessorKey: "total_amount",
      header: "Total Amount",
      cell: (info) => {
        const booking = info.row.original;
        const amount = info.getValue() as number | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {amount !== undefined && amount !== null
              ? `${booking.currency || "USD"} ${amount.toFixed(2)}`
              : "-"}
          </span>
        );
      },
    }),
    
    createTextColumn<Booking>({
      accessorKey: "payment_status",
      header: "Payment Status",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {value ?? "-"}
          </span>
        );
      },
    }),
    
    createDateTimeColumn<Booking>({
      accessorKey: "created_at",
      header: "Created At",
    }),

    createActionsColumn<Booking>({
      customActions,
      actions: [
        ...(onPayment
          ? [
              {
                icon: DollarSign,
                onClick: (booking: Booking) => onPayment(booking),
                title: (booking: Booking) =>
                  canProcessPayment(booking.status)
                    ? "Settle Payment"
                    : `Payment not allowed for status: ${booking.status.toUpperCase()}`,
                disabledWhen: (booking: Booking) => !canProcessPayment(booking.status),
                className:
                  "h-7 w-7 p-0 hover:bg-green-500/10 hover:text-green-600 transition-colors",
              },
            ]
          : []),
        ...(onCancel
          ? [
              {
                icon: X,
                onClick: (booking: Booking) => {
                  setSelectedBooking(booking);
                  setCancellationReason("");
                  setCancelDialogOpen(true);
                },
                title: (booking: Booking) => {
                  if (booking.status === "cancelled") return "Booking is already cancelled";
                  if (booking.status === "confirmed") return "Confirmed bookings cannot be cancelled";
                  if (booking.status === "refunded") return "Refunded bookings cannot be cancelled";
                  return "Cancel";
                },
                disabledWhen: (booking: Booking) => 
                  booking.status === "cancelled" || 
                  booking.status === "confirmed" || 
                  booking.status === "refunded",
                className:
                  "h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors",
              },
            ]
          : []),
      ],
    }),
  ];

  const tableData = bookings;
  const tablePagination = pagination
    ? {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        totalPages: pagination.totalPages,
      }
    : undefined;

  const handleCancelDialogChange = (open: boolean) => {
    setCancelDialogOpen(open);
    if (!open) {
      setSelectedBooking(null);
      setCancellationReason("");
    }
  };

  const handleCancelConfirm = () => {
    if (!cancellationReason.trim()) {
      return; // Don't proceed if reason is empty
    }
    if (!selectedBooking) {
      return;
    }
    // Validate booking status before canceling
    if (selectedBooking.status === "cancelled" || selectedBooking.status === "confirmed" || selectedBooking.status === "refunded") {
      return; // Don't proceed if booking is already cancelled, confirmed, or refunded
    }
    if (onCancel) {
      onCancel(selectedBooking, cancellationReason.trim());
    }
    setCancelDialogOpen(false);
    setSelectedBooking(null);
    setCancellationReason("");
  };

  const handleCancelDialogCancel = () => {
    setCancelDialogOpen(false);
    setSelectedBooking(null);
    setCancellationReason("");
  };

  return (
    <div className={cn("w-full", className)}>
      <DataTable<Booking>
        data={tableData}
        columns={columns}
        useDefaultColumns={false}
        title="Bookings"
        description="Manage and view bookings"
        onCreate={onCreate}
        onSearch={onSearch}
        manualPagination={Boolean(pagination && onPageChange)}
        serverPagination={tablePagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        loading={loading}
      />

      <Dialog open={cancelDialogOpen} onOpenChange={handleCancelDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              {selectedBooking && (selectedBooking.status === "cancelled" || selectedBooking.status === "confirmed" || selectedBooking.status === "refunded") ? (
                <span className="text-destructive">
                  This booking cannot be cancelled. Status: {selectedBooking.status.toUpperCase()}
                </span>
              ) : selectedBooking ? (
                `Are you sure you want to cancel booking "${getDisplayName(selectedBooking)}"? Please provide a reason for cancellation.`
              ) : (
                "Are you sure you want to cancel this booking? Please provide a reason for cancellation."
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (selectedBooking.status === "cancelled" || selectedBooking.status === "confirmed" || selectedBooking.status === "refunded") ? (
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelDialogCancel}>
                Close
              </Button>
            </DialogFooter>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cancellation-reason">
                    Cancellation Reason <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="cancellation-reason"
                    placeholder="Enter reason for cancellation..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    rows={4}
                    required
                  />
                  {!cancellationReason.trim() && (
                    <p className="text-sm text-destructive">Cancellation reason is required</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCancelDialogCancel}>
                  No, Keep Booking
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleCancelConfirm}
                  disabled={!cancellationReason.trim()}
                >
                  Yes, Cancel Booking
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

