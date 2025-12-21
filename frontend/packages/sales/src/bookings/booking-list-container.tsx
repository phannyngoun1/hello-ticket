/**
 * Booking List Container
 *
 * Integrates the list, dialogs, and service hooks to manage bookings.
 */

import React, { useCallback, useMemo, useState } from "react";
import { toast } from "@truths/ui";
import type { Pagination } from "@truths/shared";
import type { Booking, CreateBookingInput, UpdateBookingInput, BookingFilter } from "./types";
import { BookingList } from "./booking-list";
import { CreateBookingDialog } from "./create-booking-dialog";
import { EditBookingDialog } from "./edit-booking-dialog";
import {
  useBookings,
  useCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
} from "./use-bookings";
import { useBookingService } from "./booking-provider";

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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const prevAutoOpenRef = React.useRef(false);

  React.useEffect(() => {
    const wasAutoOpen = prevAutoOpenRef.current;
    if (autoOpenCreate && !wasAutoOpen) {
      setCreateDialogOpen(true);
    }
    prevAutoOpenRef.current = !!autoOpenCreate;
  }, [autoOpenCreate]);

  const { data, isLoading, error } = useBookings(bookingService, {
    filter,
    pagination,
  });

  const createMutation = useCreateBooking(bookingService);
  const updateMutation = useUpdateBooking(bookingService);
  const deleteMutation = useDeleteBooking(bookingService);

  const bookings = data?.data ?? [];
  const paginationData = data?.pagination;

  const handleCreate = useCallback(() => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
    setCreateDialogOpen(true);
  }, [onNavigateToCreate]);

  const handleEdit = useCallback((booking: Booking) => {
    setBookingToEdit(booking);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (booking: Booking) => {
      try {
        await deleteMutation.mutateAsync(booking.id);
        toast({ title: "Success", description: "Booking deleted successfully" });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to delete booking",
          variant: "destructive",
        });
      }
    },
    [deleteMutation]
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
    async (input: CreateBookingInput) => {
      try {
        await createMutation.mutateAsync(input);
        toast({ title: "Success", description: "Booking created successfully" });
        setCreateDialogOpen(false);
        onCreateDialogClose?.();
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

  const handleEditSubmit = useCallback(
    async (id: string, input: UpdateBookingInput) => {
      try {
        await updateMutation.mutateAsync({ id, input });
        toast({ title: "Success", description: "Booking updated successfully" });
        setEditDialogOpen(false);
        setBookingToEdit(null);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update booking",
          variant: "destructive",
        });
        throw err;
      }
    },
    [updateMutation]
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
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        onSearch={handleSearch}
        pagination={serverPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
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

      <EditBookingDialog
        open={editDialogOpen && !!bookingToEdit}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setBookingToEdit(null);
          }
        }}
        onSubmit={handleEditSubmit}
        booking={bookingToEdit}
      />
    </>
  );
}

