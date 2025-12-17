/**
 * {{EntityName}} List Component
 *
 * Table view for {{entity-plural}} with configurable columns and actions.
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
import type { {{EntityName}} } from "./types";

export interface {{EntityName}}ListProps {
  className?: string;
  {{entityPlural}}?: {{EntityName}}[];
  loading?: boolean;
  error?: Error | null;
  pagination?: Pagination;
  on{{EntityName}}Click?: ({{entityName}}: {{EntityName}}) => void;
  onEdit?: ({{entityName}}: {{EntityName}}) => void;
  onDelete?: ({{entityName}}: {{EntityName}}) => void;
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  customActions?: ({{entityName}}: {{EntityName}}) => React.ReactNode;
}

export function {{EntityName}}List({
  className,
  {{entityPlural}} = [],
  loading = false,
  error = null,
  pagination,
  on{{EntityName}}Click,
  onEdit,
  onDelete,
  onCreate,
  onSearch,
  onPageChange,
  onPageSizeChange,
  customActions,
}: {{EntityName}}ListProps) {
  const density = useDensityStyles();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selected{{EntityName}}, setSelected{{EntityName}}] = useState<{{EntityName}} | null>(null);

  const getDisplayName = ({{entityName}}: {{EntityName}}) => {
    const value = {{entityName}}.{{primaryField.name}};
    return typeof value === "string" && value.trim().length > 0 ? value : String({{entityName}}.id);
  };

  const getInitials = (value: string | undefined) => {
    if (!value) return "?";
    const letters = value.replace(/[^A-Za-z]/g, "");
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    if (value.length >= 2) return value.slice(0, 2).toUpperCase();
    return value.charAt(0).toUpperCase();
  };

  const columns: ColumnDef<{{EntityName}}>[] = [
    createIdentifiedColumn<{{EntityName}}>({
      getDisplayName,
      getInitials: (item) => getInitials(item.{{primaryField.name}} as string | undefined),
      header: "{{primaryField.label}}",
      showAvatar: false,
      onClick: on{{EntityName}}Click,
      additionalOptions: {
        id: "{{primaryField.name}}",
      },
    }),
{{#listColumns}}
{{#if isDate}}
    createDateTimeColumn<{{EntityName}}>({
      accessorKey: "{{name}}",
      header: "{{label}}",
    }),
{{else}}
    {{#if isBoolean}}
    createTextColumn<{{EntityName}}>({
      accessorKey: "{{name}}",
      header: "{{label}}",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {value ? "Yes" : "No"}
          </span>
        );
      },
    }),
    {{else}}
    createTextColumn<{{EntityName}}>({
      accessorKey: "{{name}}",
      header: "{{label}}",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {value ?? "-"}
          </span>
        );
      },
    }),
    {{/if}}
{{/if}}
{{/listColumns}}
    createActionsColumn<{{EntityName}}>({
      customActions,
      actions: [
        ...(onEdit
          ? [
              {
                icon: Edit,
                onClick: ({{entityName}}: {{EntityName}}) => onEdit({{entityName}}),
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
                onClick: ({{entityName}}: {{EntityName}}) => {
                  setSelected{{EntityName}}({{entityName}});
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

  const tableData = {{entityPlural}};
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
      setSelected{{EntityName}}(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (selected{{EntityName}} && onDelete) {
      onDelete(selected{{EntityName}});
    }
    setDeleteConfirmOpen(false);
    setSelected{{EntityName}}(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSelected{{EntityName}}(null);
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
      <DataTable<{{EntityName}}>
        data={tableData}
        columns={columns}
        useDefaultColumns={false}
        title="{{EntityPlural}}"
        description="Manage and view {{entity-plural}}"
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
        title="Delete {{EntityName}}"
        description={
          selected{{EntityName}}
            ? `Are you sure you want to delete "${getDisplayName(selected{{EntityName}})}"? This action cannot be undone.`
            : "Are you sure you want to delete this {{entity-name}}?"
        }
        confirmAction={deleteConfirmAction}
        cancelAction={deleteCancelAction}
      />
    </div>
  );
}

