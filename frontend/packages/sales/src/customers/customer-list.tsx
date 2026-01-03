/**
 * Customer List Component
 *
 * Table view for customers with configurable columns.
 *
 * @author Phanny
 */

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@truths/ui/lib/utils";
import { useDensityStyles } from "@truths/utils";
import {
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
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function CustomerList({
  className,
  customers = [],
  loading = false,
  error = null,
  pagination,
  onCustomerClick,
  onCreate,
  onSearch,
  onPageChange,
  onPageSizeChange,
}: CustomerListProps) {
  const density = useDensityStyles();

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
    </div>
  );
}
