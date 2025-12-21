/**
 * Show List Component
 *
 * Table view for shows with configurable columns and actions.
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
import type { Show } from "./types";

export interface ShowListProps {
  className?: string;
  shows?: Show[];
  loading?: boolean;
  error?: Error | null;
  pagination?: Pagination;
  onShowClick?: (show: Show) => void;
  onEdit?: (show: Show) => void;
  onDelete?: (show: Show) => void;
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  customActions?: (show: Show) => React.ReactNode;
}

export function ShowList({
  className,
  shows = [],
  loading = false,
  error = null,
  pagination,
  onShowClick,
  onEdit,
  onDelete,
  onCreate,
  onSearch,
  onPageChange,
  onPageSizeChange,
  customActions,
}: ShowListProps) {
  const density = useDensityStyles();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);

  const getDisplayName = (show: Show) => {
    const value = show.code;
    return typeof value === "string" && value.trim().length > 0 ? value : String(show.id);
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
    


    createActionsColumn<Show>({
      customActions,
      actions: [
        ...(onEdit
          ? [
              {
                icon: Edit,
                onClick: (show: Show) => onEdit(show),
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
                onClick: (show: Show) => {
                  setSelectedShow(show);
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
        confirmAction={deleteConfirmAction}
        cancelAction={deleteCancelAction}
      />
    </div>
  );
}

