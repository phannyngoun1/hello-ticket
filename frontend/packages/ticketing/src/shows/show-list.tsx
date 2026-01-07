/**
 * Show List Component
 *
 * Table view for shows with configurable columns and actions.
 */

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@truths/ui/lib/utils";
import { useDensityStyles } from "@truths/utils";
import {
  ConfirmationDialog,
  createIdentifiedColumn,
  createTextColumn,
  DataTable,
} from "@truths/custom-ui";
import { Pagination } from "@truths/shared";
import type { Show } from "./types";

export interface ShowListProps {
  className?: string;
  shows?: Show[];
  loading?: boolean;
  error?: Error | null;
  pagination?: Pagination;
  onShowClick?: (show: Show) => void;
  onDelete?: (show: Show) => void;
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function ShowList({
  className,
  shows = [],
  loading = false,
  pagination,
  onShowClick,
  onDelete,
  onCreate,
  onSearch,
  onPageChange,
  onPageSizeChange,
}: ShowListProps) {
  const density = useDensityStyles();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);

  const getDisplayName = (show: Show) => {
    const value = show.code;
    return typeof value === "string" && value.trim().length > 0
      ? value
      : String(show.id);
  };

  const getInitials = (value: string | undefined) => {
    if (!value) return "?";
    const letters = value.replace(/[^A-Za-z]/g, "");
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    if (value.length >= 2) return value.slice(0, 2).toUpperCase();
    return value.charAt(0).toUpperCase();
  };

  const columns: ColumnDef<Show>[] = [
    createIdentifiedColumn<Show>({
      getDisplayName,
      getInitials: (item) => getInitials(item.code as string | undefined),
      header: "Code",
      showAvatar: false,
      onClick: onShowClick,
      additionalOptions: {
        id: "code",
      },
    }),

    createTextColumn<Show>({
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

    createTextColumn<Show>({
      accessorKey: "organizer_id",
      header: "Organizer",
      cell: (info) => {
        const show = info.row.original;
        // This will be populated by the container if organizer data is available
        const organizerName = show.organizer?.name;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {organizerName ?? "-"}
          </span>
        );
      },
      additionalOptions: {
        id: "organizer",
      },
    }),

    createTextColumn<Show>({
      accessorKey: "started_date",
      header: "Show Date From",
      cell: (info) => {
        const show = info.row.original;
        const date = show.started_date;
        if (!date)
          return (
            <span className={cn("text-muted-foreground", density.textSize)}>
              -
            </span>
          );
        try {
          const dateObj = new Date(date);
          return (
            <span className={cn("text-muted-foreground", density.textSize)}>
              {dateObj.toLocaleDateString()}
            </span>
          );
        } catch {
          return (
            <span className={cn("text-muted-foreground", density.textSize)}>
              -
            </span>
          );
        }
      },
    }),

    createTextColumn<Show>({
      accessorKey: "ended_date",
      header: "Show Date To",
      cell: (info) => {
        const show = info.row.original;
        const date = show.ended_date;
        if (!date)
          return (
            <span className={cn("text-muted-foreground", density.textSize)}>
              -
            </span>
          );
        try {
          const dateObj = new Date(date);
          return (
            <span className={cn("text-muted-foreground", density.textSize)}>
              {dateObj.toLocaleDateString()}
            </span>
          );
        } catch {
          return (
            <span className={cn("text-muted-foreground", density.textSize)}>
              -
            </span>
          );
        }
      },
    }),
  ];

  const tableData = shows;
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
      setSelectedShow(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedShow && onDelete) {
      onDelete(selectedShow);
    }
    setDeleteConfirmOpen(false);
    setSelectedShow(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSelectedShow(null);
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
      <DataTable<Show>
        data={tableData}
        columns={columns}
        useDefaultColumns={false}
        title="Shows"
        description="Manage and view shows"
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
        title="Delete Show"
        description={
          selectedShow
            ? `Are you sure you want to delete "${getDisplayName(selectedShow)}"? This action cannot be undone.`
            : "Are you sure you want to delete this show?"
        }
        confirmText="delete"
        confirmTextLabel="Type to confirm"
        confirmTextPlaceholder='Type "delete" to confirm'
        confirmAction={deleteConfirmAction}
        cancelAction={deleteCancelAction}
      />
    </div>
  );
}
