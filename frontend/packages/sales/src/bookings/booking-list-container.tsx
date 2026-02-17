/**
 * Booking List Container
 *
 * Integrates the list, dialogs, and service hooks to manage bookings.
 */

import React, { useCallback, useMemo, useState } from "react";
import { toast } from "@truths/ui";
import type { Pagination } from "@truths/shared";
import type { Booking, CreateBookingInput, BookingFilter } from "./types";
import { BookingList } from "./booking-list";
import { CreateBookingDialog } from "./create-booking-dialog";
import {
  useBookings,
  useCreateBooking,
  useDeleteBooking,
} from "./use-bookings";
import { useBookingService } from "./booking-provider";
import { PaymentDialog } from "../payments/payment-dialog";
import { VoidPaymentsDialog } from "../payments/void-payments-dialog";
import { useCreatePayment } from "../payments/use-payments";
import { PaymentService } from "../payments/payment-service";
import { api } from "@truths/api";

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

export interface BookingListContainerProps {
  onNavigateToBooking?: (id: string) => void;
  onNavigateToCreate?: () => void;
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function BookingListContainer({
  onNavigateToBooking,
  onNavigateToCreate,
  autoOpenCreate,
  onCreateDialogClose,
}: BookingListContainerProps) {
  const bookingService = useBookingService();

  const [filter, setFilter] = useState<BookingFilter>({});
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 50 });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [voidPaymentDialogOpen, setVoidPaymentDialogOpen] = useState(false);
  const [bookingForPayment, setBookingForPayment] = useState<Booking | null>(null);
  const [bookingForVoidPayment, setBookingForVoidPayment] = useState<Booking | null>(null);

  // Create payment service
  const paymentService = useMemo(
    () =>
      new PaymentService({
        apiClient: api,
        endpoints: {
          payments: "/api/v1/sales/payments",
        },
      }),
    []
  );
  const prevAutoOpenRef = React.useRef(false);

  React.useEffect(() => {
    const wasAutoOpen = prevAutoOpenRef.current;
    if (autoOpenCreate && !wasAutoOpen) {
      setCreateDialogOpen(true);
    }
    prevAutoOpenRef.current = !!autoOpenCreate;
  }, [autoOpenCreate]);

  const { data, isLoading, error, refetch, isFetching } = useBookings(
    bookingService,
    { filter, pagination }
  );

  const createMutation = useCreateBooking(bookingService);
  const deleteMutation = useDeleteBooking(bookingService);
  const createPaymentMutation = useCreatePayment(paymentService);

  const bookings = data?.data ?? [];
  const paginationData = data?.pagination;

  const handleCreate = useCallback(() => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
    setCreateDialogOpen(true);
  }, [onNavigateToCreate]);

  const handleCancel = useCallback(
    async (booking: Booking, cancellationReason: string) => {
      try {
        await deleteMutation.mutateAsync({ id: booking.id, cancellationReason });
        toast({ title: "Success", description: "Booking cancelled successfully" });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to cancel booking",
          variant: "destructive",
        });
      }
    },
    [deleteMutation]
  );

  const handlePayment = useCallback((booking: Booking) => {
    // Validate booking status before opening payment dialog
    if (!canProcessPayment(booking.status)) {
      toast({
        title: "Payment Not Allowed",
        description: `Payments can only be processed for bookings with status PENDING, CONFIRMED, or RESERVED. Current status: ${booking.status.toUpperCase()}`,
        variant: "destructive",
      });
      return;
    }
    setBookingForPayment(booking);
    setPaymentDialogOpen(true);
  }, []);

  const handleVoidPayment = useCallback((booking: Booking) => {
    setBookingForVoidPayment(booking);
    setVoidPaymentDialogOpen(true);
  }, []);

  const handlePaymentSubmit = useCallback(
    async (input: import("../payments/types").CreatePaymentInput) => {
      try {
        await createPaymentMutation.mutateAsync(input);
        toast({ title: "Success", description: "Payment processed successfully" });
        setPaymentDialogOpen(false);
        setBookingForPayment(null);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to process payment",
          variant: "destructive",
        });
        throw err;
      }
    },
    [createPaymentMutation]
  );

  const handleSearch = useCallback((query: string) => {
    setFilter((prev) => ({ ...prev, search: query || undefined }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination({ page: 1, pageSize });
  }, []);

  const handleCreateSubmit = useCallback(
    async (
      input: CreateBookingInput,
      options?: { payNow?: boolean }
    ) => {
      try {
        const booking = await createMutation.mutateAsync(input);
        toast({ title: "Success", description: "Booking created successfully" });
        setCreateDialogOpen(false);
        onCreateDialogClose?.();
        if (options?.payNow && canProcessPayment(booking.status)) {
          setBookingForPayment(booking);
          setPaymentDialogOpen(true);
        }
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to create booking",
          variant: "destructive",
        });
        throw err;
      }
    },
    [createMutation, onCreateDialogClose]
  );

  const handleNavigateToBooking = useCallback(
    (booking: Booking) => {
      onNavigateToBooking?.(booking.id);
    },
    [onNavigateToBooking]
  );

  const serverPagination = useMemo(() => {
    if (!paginationData) return undefined;
    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: paginationData.total,
      totalPages: paginationData.totalPages,
    };
  }, [pagination, paginationData]);

  return (
    <>
      <BookingList
        bookings={bookings}
        loading={isLoading}
        error={error as Error | null}
        onBookingClick={handleNavigateToBooking}
        onCancel={handleCancel}
        onPayment={handlePayment}
        onVoidPayment={handleVoidPayment}
        onCreate={handleCreate}
        onSearch={handleSearch}
        pagination={serverPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={() => refetch()}
        isRefetching={isFetching}
      />

      <CreateBookingDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }
        }}
        onSubmit={handleCreateSubmit}
      />

      <PaymentDialog
        open={paymentDialogOpen && !!bookingForPayment}
        onOpenChange={(open) => {
          setPaymentDialogOpen(open);
          if (!open) {
            setBookingForPayment(null);
          }
        }}
        onSubmit={handlePaymentSubmit}
        booking={bookingForPayment}
        isLoading={createPaymentMutation.isPending}
      />

      <VoidPaymentsDialog
        open={voidPaymentDialogOpen && !!bookingForVoidPayment}
        onOpenChange={(open) => {
          setVoidPaymentDialogOpen(open);
          if (!open) {
            setBookingForVoidPayment(null);
          }
        }}
        booking={bookingForVoidPayment}
      />
    </>
  );
}

