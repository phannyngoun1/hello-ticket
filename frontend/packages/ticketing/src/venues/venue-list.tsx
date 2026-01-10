/**
 * Venue List Component
 *
 * Table view for venues with configurable columns and actions.
 */

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@truths/ui/lib/utils";
import { useDensityStyles } from "@truths/utils";
import {
  ConfirmationDialog,
  createIdentifiedColumn,
  createTextColumn,
  createDateTimeColumn,
  DataTable,
} from "@truths/custom-ui";
import { Pagination } from "@truths/shared";
import type { Venue } from "./types";

export interface VenueListProps {
  className?: string;
  venues?: Venue[];
  loading?: boolean;
  error?: Error | null;
  pagination?: Pagination;
  onVenueClick?: (venue: Venue) => void;
  onEdit?: (venue: Venue) => void;
  onDelete?: (venue: Venue) => void;
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  customActions?: (venue: Venue) => React.ReactNode;
}

export function VenueList({
  className,
  venues = [],
  loading = false,
  pagination,
  onVenueClick,
  onDelete,
  onCreate,
  onSearch,
  onPageChange,
  onPageSizeChange,
}: VenueListProps) {
  const density = useDensityStyles();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const getDisplayName = (venue: Venue) => {
    const value = venue.code;
    return typeof value === "string" && value.trim().length > 0
      ? value
      : String(venue.id);
  };

  const getInitials = (value: string | undefined) => {
    if (!value) return "?";
    const letters = value.replace(/[^A-Za-z]/g, "");
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    if (value.length >= 2) return value.slice(0, 2).toUpperCase();
    return value.charAt(0).toUpperCase();
  };

  const columns: ColumnDef<Venue>[] = [
    createIdentifiedColumn<Venue>({
      getDisplayName,
      getInitials: (item) => getInitials(item.code as string | undefined),
      header: "Code",
      showAvatar: false,
      onClick: onVenueClick,
      additionalOptions: {
        id: "code",
      },
    }),

    createTextColumn<Venue>({
      accessorKey: "name",
      header: "Name",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("font-medium", density.textSize)}>
            {value ?? "-"}
          </span>
        );
      },
    }),

    createTextColumn<Venue>({
      accessorKey: "venue_type",
      header: "Type",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {value ?? "-"}
          </span>
        );
      },
    }),

    createTextColumn<Venue>({
      accessorKey: "phone",
      header: "Phone",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <div className="flex items-center gap-2">
            {value ? (
              <span className={cn("text-muted-foreground", density.textSize)}>
                {value}
              </span>
            ) : (
              <span className={cn("text-muted-foreground", density.textSize)}>
                -
              </span>
            )}
          </div>
        );
      },
    }),

    createTextColumn<Venue>({
      accessorKey: "email",
      header: "Email",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <div className="flex items-center gap-2">
            {value ? (
              <>
                <span className={cn("text-muted-foreground", density.textSize)}>
                  {value}
                </span>
              </>
            ) : (
              <span className={cn("text-muted-foreground", density.textSize)}>
                -
              </span>
            )}
          </div>
        );
      },
    }),

    createTextColumn<Venue>({
      accessorKey: "city",
      header: "Address",
      cell: (info) => {
        const venue = info.row.original;
        const city = venue.city;
        const state = venue.state_province;
        const country = venue.country;
        const location = [city, state, country].filter(Boolean).join(", ");
        return (
          <div className="flex items-center gap-2">
            {location ? (
              <>
                <span className={cn("text-muted-foreground", density.textSize)}>
                  {location}
                </span>
              </>
            ) : (
              <span className={cn("text-muted-foreground", density.textSize)}>
                -
              </span>
            )}
          </div>
        );
      },
    }),

    createDateTimeColumn<Venue>({
      accessorKey: "created_at",
      header: "Date Created",
      cell: (info) => {
        const value = info.getValue() as Date | string | null | undefined;
        if (!value)
          return (
            <span className={cn("text-muted-foreground", density.textSize)}>
              -
            </span>
          );
        const date = value instanceof Date ? value : new Date(value);
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {date.toLocaleDateString()}
          </span>
        );
      },
    }),
  ];

  const tableData = venues;
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
      setSelectedVenue(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedVenue && onDelete) {
      onDelete(selectedVenue);
    }
    setDeleteConfirmOpen(false);
    setSelectedVenue(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSelectedVenue(null);
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
      <DataTable<Venue>
        data={tableData}
        columns={columns}
        useDefaultColumns={false}
        title="Venues"
        description="Manage and view venues"
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
        title="Delete Venue"
        description={
          selectedVenue
            ? `Are you sure you want to delete "${getDisplayName(selectedVenue)}"? This action cannot be undone.`
            : "Are you sure you want to delete this venue?"
        }
        confirmAction={deleteConfirmAction}
        cancelAction={deleteCancelAction}
      />
    </div>
  );
}
