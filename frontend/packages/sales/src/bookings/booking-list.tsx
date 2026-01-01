/**
 * Booking List Component
 *
 * Table view for bookings with configurable columns and actions.
 */

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { X, DollarSign, Ban } from "lucide-react";
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
 * Payments can be made for PENDING, RESERVED, or CONFIRMED bookings
 * (PENDING is allowed for direct agency bookings where payment can be taken immediately)
 */
function canProcessPayment(status: string): boolean {
  const normalizedStatus = status.toLowerCase().trim();
  return (
    normalizedStatus === "pending" ||
    normalizedStatus === "confirmed" ||
    normalizedStatus === "reserved"
  );
}

/**
 * Check if a booking can be cancelled
 * Only pending bookings without payments can be cancelled
 */
function canCancelBooking(booking: Booking): boolean {
  const normalizedStatus = booking.status.toLowerCase().trim();
  if (normalizedStatus !== "pending") {
    return false;
  }
  // Check if booking has any payments (partial or full)
  // payment_status will be "processing" (partial) or "completed" (full) if payments exist
  const paymentStatus = booking.payment_status?.toLowerCase().trim();
  // Only allow cancellation if payment_status is "pending" or undefined/null (no payments)
  return !paymentStatus || paymentStatus === "pending";
}

/**
 * Get cancellation reason message
 */
function getCancellationReason(booking: Booking): string {
  const normalizedStatus = booking.status.toLowerCase().trim();
  if (normalizedStatus === "cancelled") {
    return "Booking is already cancelled";
  }
  if (normalizedStatus !== "pending") {
    return `Only pending bookings can be cancelled. Current status: ${booking.status.toUpperCase()}`;
  }
  const paymentStatus = booking.payment_status?.toLowerCase().trim();
  if (paymentStatus && paymentStatus !== "pending") {
    return `Cannot cancel booking with payments. Payment status: ${booking.payment_status?.toUpperCase()}`;
  }
  return "Cancel";
}

/**
 * Check if a booking has voidable payments
 * Payments can be voided if booking has payment_status of 'processing' or 'completed'
 * and booking is not cancelled
 */
function canVoidPayment(booking: Booking): boolean {
  const normalizedStatus = booking.status.toLowerCase().trim();
  // Cannot void payments for cancelled bookings
  if (normalizedStatus === "cancelled") {
    return false;
  }
  const paymentStatus = booking.payment_status?.toLowerCase().trim();
  // Can void if payment_status indicates payments exist (processing or completed)
  return paymentStatus === "processing" || paymentStatus === "paid";
}

/**
 * Get void payment reason message
 */
function getVoidPaymentReason(booking: Booking): string {
  const normalizedStatus = booking.status.toLowerCase().trim();
  if (normalizedStatus === "cancelled") {
    return "Cannot void payments for cancelled bookings";
  }
  const paymentStatus = booking.payment_status?.toLowerCase().trim();
  if (!paymentStatus || paymentStatus === "pending") {
    return "No payments to void";
  }
  if (paymentStatus === "refunded") {
    return "Payments are already refunded";
  }
  return "Void Payment";
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
  onVoidPayment?: (booking: Booking) => void;
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
  onVoidPayment,
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
                title: (booking: Booking) => {
                  if (booking.payment_status === "paid") {
                    return "Booking is fully paid";
                  }
                  return canProcessPayment(booking.status)
                    ? "Settle Payment"
                    : `Payment not allowed for status: ${booking.status.toUpperCase()}`;
                },
                disabledWhen: (booking: Booking) => 
                  !canProcessPayment(booking.status) || booking.payment_status === "paid",
                className:
                  "h-7 w-7 p-0 hover:bg-green-500/10 hover:text-green-600 transition-colors",
              },
            ]
          : []),
        ...(onVoidPayment
          ? [
              {
                icon: Ban,
                onClick: (booking: Booking) => onVoidPayment(booking),
                title: (booking: Booking) => getVoidPaymentReason(booking),
                disabledWhen: (booking: Booking) => !canVoidPayment(booking),
                className:
                  "h-7 w-7 p-0 hover:bg-orange-500/10 hover:text-orange-600 transition-colors",
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
                title: (booking: Booking) => getCancellationReason(booking),
                disabledWhen: (booking: Booking) => !canCancelBooking(booking),
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
    // Validate booking can be cancelled
    if (!canCancelBooking(selectedBooking)) {
      return; // Don't proceed if booking cannot be cancelled
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
              {selectedBooking && !canCancelBooking(selectedBooking) ? (
                <span className="text-destructive">
                  This booking cannot be cancelled. {getCancellationReason(selectedBooking)}
                </span>
              ) : selectedBooking ? (
                `Are you sure you want to cancel booking "${getDisplayName(selectedBooking)}"? Please provide a reason for cancellation.`
              ) : (
                "Are you sure you want to cancel this booking? Please provide a reason for cancellation."
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && !canCancelBooking(selectedBooking) ? (
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

