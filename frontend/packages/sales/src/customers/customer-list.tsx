/**
 * Customer List Component
 *
 * Table view for customers with configurable columns and actions.
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
  DataTable,
} from "@truths/custom-ui";
import { Pagination } from "@truths/shared";
import type { Customer } from "../types";

export interface CustomerListProps {
  className?: string;
  customers?: Customer[];
  loading?: boolean;
  error?: Error | null;
  pagination?: Pagination;
  onCustomerClick?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  customActions?: (customer: Customer) => React.ReactNode;
}

export function CustomerList({
  className,
  customers = [],
  loading = false,
  error = null,
  pagination,
  onCustomerClick,
  onEdit,
  onDelete,
  onCreate,
  onSearch,
  onPageChange,
  onPageSizeChange,
  customActions,
}: CustomerListProps) {
  const density = useDensityStyles();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const getDisplayName = (customer: Customer) => {
    const value = customer.code;
    return typeof value === "string" && value.trim().length > 0 ? value : String(customer.id);
  };

  const getInitials = (value: string | undefined) => {
    if (!value) return "?";
    const letters = value.replace(/[^A-Za-z]/g, "");
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    if (value.length >= 2) return value.slice(0, 2).toUpperCase();
    return value.charAt(0).toUpperCase();
  };

  const columns: ColumnDef<Customer>[] = [
    createIdentifiedColumn<Customer>({
      getDisplayName,
      getInitials: (item) => getInitials(item.code as string | undefined),
      header: "Code",
      showAvatar: false,
      onClick: onCustomerClick,
      additionalOptions: {
        id: "code",
      },
    }),

    createTextColumn<Customer>({
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

    createTextColumn<Customer>({
      accessorKey: "email",
      header: "Email",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {value ?? "-"}
          </span>
        );
      },
    }),

    createTextColumn<Customer>({
      accessorKey: "phone",
      header: "Phone",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {value ?? "-"}
          </span>
        );
      },
    }),

    createTextColumn<Customer>({
      accessorKey: "business_name",
      header: "Business Name",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {value ?? "-"}
          </span>
        );
      },
    }),

    createTextColumn<Customer>({
      accessorKey: "city",
      header: "City",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {value ?? "-"}
          </span>
        );
      },
    }),

    createTextColumn<Customer>({
      accessorKey: "priority",
      header: "Priority",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        if (!value) return <span className={cn("text-muted-foreground", density.textSize)}>-</span>;
        const priorityColors = {
          high: "text-destructive",
          medium: "text-yellow-600",
          low: "text-muted-foreground",
        };
        return (
          <span className={cn(
            "capitalize",
            priorityColors[value.toLowerCase() as keyof typeof priorityColors] || "text-muted-foreground",
            density.textSize
          )}>
            {value}
          </span>
        );
      },
    }),

    createActionsColumn<Customer>({
      customActions,
      actions: [
        ...(onEdit
          ? [
              {
                icon: Edit,
                onClick: (customer: Customer) => onEdit(customer),
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
                onClick: (customer: Customer) => {
                  setSelectedCustomer(customer);
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

  const tableData = customers;
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
      setSelectedCustomer(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedCustomer && onDelete) {
      onDelete(selectedCustomer);
    }
    setDeleteConfirmOpen(false);
    setSelectedCustomer(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSelectedCustomer(null);
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
      <DataTable<Customer>
        data={tableData}
        columns={columns}
        useDefaultColumns={false}
        title="Customers"
        description="Manage and view customers"
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
        title="Delete Customer"
        description={
          selectedCustomer
            ? `Are you sure you want to delete "${getDisplayName(selectedCustomer)}"? This action cannot be undone.`
            : "Are you sure you want to delete this customer?"
        }
        confirmAction={deleteConfirmAction}
        cancelAction={deleteCancelAction}
      />
    </div>
  );
}
