/**
 * Test List Component
 *
 * Table view for tests with configurable columns and actions.
 *
 * @author Phanny
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
import type { Test } from "./types";

export interface TestListProps {
  className?: string;
  tests?: Test[];
  loading?: boolean;
  error?: Error | null;
  pagination?: Pagination;
  onTestClick?: (test: Test) => void;
  onEdit?: (test: Test) => void;
  onDelete?: (test: Test) => void;
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  customActions?: (test: Test) => React.ReactNode;
}

export function TestList({
  className,
  tests = [],
  loading = false,
  error = null,
  pagination,
  onTestClick,
  onEdit,
  onDelete,
  onCreate,
  onSearch,
  onPageChange,
  onPageSizeChange,
  customActions,
}: TestListProps) {
  const density = useDensityStyles();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  const getDisplayName = (test: Test) => {
    const value = test.code;
    return typeof value === "string" && value.trim().length > 0 ? value : String(test.id);
  };

  const getInitials = (value: string | undefined) => {
    if (!value) return "?";
    const letters = value.replace(/[^A-Za-z]/g, "");
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    if (value.length >= 2) return value.slice(0, 2).toUpperCase();
    return value.charAt(0).toUpperCase();
  };

  const columns: ColumnDef<Test>[] = [
    createIdentifiedColumn<Test>({
      getDisplayName,
      getInitials: (item) => getInitials(item.code as string | undefined),
      header: "Code",
      showAvatar: false,
      onClick: onTestClick,
      additionalOptions: {
        id: "code",
      },
    }),


    
    createTextColumn<Test>({
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
    


    createActionsColumn<Test>({
      customActions,
      actions: [
        ...(onEdit
          ? [
              {
                icon: Edit,
                onClick: (test: Test) => onEdit(test),
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
                onClick: (test: Test) => {
                  setSelectedTest(test);
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

  const tableData = tests;
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
      setSelectedTest(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedTest && onDelete) {
      onDelete(selectedTest);
    }
    setDeleteConfirmOpen(false);
    setSelectedTest(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSelectedTest(null);
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
      <DataTable<Test>
        data={tableData}
        columns={columns}
        useDefaultColumns={false}
        title="Tests"
        description="Manage and view tests"
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
        title="Delete Test"
        description={
          selectedTest
            ? `Are you sure you want to delete "${getDisplayName(selectedTest)}"? This action cannot be undone.`
            : "Are you sure you want to delete this test?"
        }
        confirmAction={deleteConfirmAction}
        cancelAction={deleteCancelAction}
      />
    </div>
  );
}

