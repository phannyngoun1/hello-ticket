/**
 * Organizer List Component
 *
 * Table view for organizers with configurable columns and actions.
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
import type { Organizer } from "./types";

export interface OrganizerListProps {
  className?: string;
  organizers?: Organizer[];
  loading?: boolean;
  error?: Error | null;
  pagination?: Pagination;
  onOrganizerClick?: (organizer: Organizer) => void;
  onEdit?: (organizer: Organizer) => void;
  onDelete?: (organizer: Organizer) => void;
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  customActions?: (organizer: Organizer) => React.ReactNode;
}

export function OrganizerList({
  className,
  organizers = [],
  loading = false,
  error = null,
  pagination,
  onOrganizerClick,
  onEdit,
  onDelete,
  onCreate,
  onSearch,
  onPageChange,
  onPageSizeChange,
  customActions,
}: OrganizerListProps) {
  const density = useDensityStyles();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null);

  const getDisplayName = (organizer: Organizer) => {
    const value = organizer.code;
    return typeof value === "string" && value.trim().length > 0 ? value : String(organizer.id);
  };

  const getInitials = (value: string | undefined) => {
    if (!value) return "?";
    const letters = value.replace(/[^A-Za-z]/g, "");
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    if (value.length >= 2) return value.slice(0, 2).toUpperCase();
    return value.charAt(0).toUpperCase();
  };

  const columns: ColumnDef<Organizer>[] = [
    createIdentifiedColumn<Organizer>({
      getDisplayName,
      getInitials: (item) => getInitials(item.code as string | undefined),
      header: "Code",
      showAvatar: false,
      onClick: onOrganizerClick,
      additionalOptions: {
        id: "code",
      },
    }),


    
    createTextColumn<Organizer>({
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
    


    createActionsColumn<Organizer>({
      customActions,
      actions: [
        ...(onEdit
          ? [
              {
                icon: Edit,
                onClick: (organizer: Organizer) => onEdit(organizer),
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
                onClick: (organizer: Organizer) => {
                  setSelectedOrganizer(organizer);
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

  const tableData = organizers;
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
      setSelectedOrganizer(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedOrganizer && onDelete) {
      onDelete(selectedOrganizer);
    }
    setDeleteConfirmOpen(false);
    setSelectedOrganizer(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSelectedOrganizer(null);
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
      <DataTable<Organizer>
        data={tableData}
        columns={columns}
        useDefaultColumns={false}
        title="Organizers"
        description="Manage and view organizers"
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
        title="Delete Organizer"
        description={
          selectedOrganizer
            ? `Are you sure you want to delete "${getDisplayName(selectedOrganizer)}"? This action cannot be undone.`
            : "Are you sure you want to delete this organizer?"
        }
        confirmAction={deleteConfirmAction}
        cancelAction={deleteCancelAction}
      />
    </div>
  );
}

