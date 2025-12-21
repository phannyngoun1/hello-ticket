/**
 * Booking List Component
 *
 * Table view for bookings with configurable columns and actions.
 */

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { useDensityStyles } from "@truths/utils";
import {
  ConfirmationDialog,
  createActionsColumn,
  createIdentifiedColumn,
  createTextColumn,
  createDateTimeColumn,
  DataTable,
} from "@truths/custom-ui";
import { Pagination } from "@truths/shared";
import type { Booking } from "./types";

export interface BookingListProps {
  className?: string;
  bookings?: Booking[];
  loading?: boolean;
  error?: Error | null;
  pagination?: Pagination;
  onBookingClick?: (booking: Booking) => void;
  onEdit?: (booking: Booking) => void;
  onDelete?: (booking: Booking) => void;
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
  onEdit,
  onDelete,
  onCreate,
  onSearch,
  onPageChange,
  onPageSizeChange,
  customActions,
}: BookingListProps) {
  const density = useDensityStyles();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const getDisplayName = (booking: Booking) => {
    const value = booking.code;
    return typeof value === "string" && value.trim().length > 0 ? value : String(booking.id);
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
      getInitials: (item) => getInitials(item.code as string | undefined),
      header: "Code",
      showAvatar: false,
      onClick: onBookingClick,
      additionalOptions: {
        id: "code",
      },
    }),


    
    createTextColumn<Booking>({
      accessorKey: "name",
      header: "Name",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {value ?? "-"}
          </span>
        );
      },
    }),
    


    createActionsColumn<Booking>({
      customActions,
      actions: [
        ...(onEdit
          ? [
              {
                icon: Edit,
                onClick: (booking: Booking) => onEdit(booking),
                title: "Edit",
                className:
                  "h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors",
              },
            ]
          : []),
        ...(onDelete
          ? [
              {
                icon: Trash2,
                onClick: (booking: Booking) => {
                  setSelectedBooking(booking);
                  setDeleteConfirmOpen(true);
                },
                title: "Delete",
                className:
                  "h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors",
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

  const handleDeleteConfirmChange = (open: boolean) => {
    setDeleteConfirmOpen(open);
    if (!open) {
      setSelectedBooking(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedBooking && onDelete) {
      onDelete(selectedBooking);
    }
    setDeleteConfirmOpen(false);
    setSelectedBooking(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSelectedBooking(null);
  };

  const deleteConfirmAction = {
    label: "Delete",
    onClick: handleDeleteConfirm,
    variant: "destructive" as const,
  };

  const deleteCancelAction = {
    label: "Cancel",
    onClick: handleDeleteCancel,
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

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={handleDeleteConfirmChange}
        title="Delete Booking"
        description={
          selectedBooking
            ? `Are you sure you want to delete "${getDisplayName(selectedBooking)}"? This action cannot be undone.`
            : "Are you sure you want to delete this booking?"
        }
        confirmAction={deleteConfirmAction}
        cancelAction={deleteCancelAction}
      />
    </div>
  );
}

