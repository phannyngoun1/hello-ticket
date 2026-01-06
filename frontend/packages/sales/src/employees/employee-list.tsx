/**
 * Employee List Component
 *
 * Table view for employees with configurable columns and actions.
 */

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@truths/ui/lib/utils";
import { useDensityStyles } from "@truths/utils";
import {
  createActionsColumn,
  createIdentifiedColumn,
  createTextColumn,
  createDateTimeColumn,
  DataTable,
} from "@truths/custom-ui";
import { Pagination } from "@truths/shared";
import type { Employee } from "./types";

export interface EmployeeListProps {
  className?: string;
  employees?: Employee[];
  loading?: boolean;
  error?: Error | null;
  pagination?: Pagination;
  onEmployeeClick?: (employee: Employee) => void;
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  customActions?: (employee: Employee) => React.ReactNode;
}

export function EmployeeList({
  className,
  employees = [],
  loading = false,
  error = null,
  pagination,
  onEmployeeClick,
  onCreate,
  onSearch,
  onPageChange,
  onPageSizeChange,
  customActions,
}: EmployeeListProps) {
  const density = useDensityStyles();

  const getDisplayName = (employee: Employee) => {
    return employee.code || employee.name || String(employee.id);
  };

  const getInitials = (value: string | undefined) => {
    if (!value) return "?";
    const letters = value.replace(/[^A-Za-z]/g, "");
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    if (value.length >= 2) return value.slice(0, 2).toUpperCase();
    return value.charAt(0).toUpperCase();
  };

  const columns: ColumnDef<Employee>[] = [
    createIdentifiedColumn<Employee>({
      getDisplayName,
      getInitials: (item) => getInitials(item.code),
      header: "Code",
      showAvatar: false,
      onClick: onEmployeeClick,
      additionalOptions: {
        id: "code",
      },
    }),


    
    createTextColumn<Employee>({
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

    createTextColumn<Employee>({
      accessorKey: "job_title",
      header: "Job Title",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {value ?? "-"}
          </span>
        );
      },
    }),

    createTextColumn<Employee>({
      accessorKey: "department",
      header: "Department",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {value ?? "-"}
          </span>
        );
      },
    }),

    createTextColumn<Employee>({
      accessorKey: "work_email",
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

    createTextColumn<Employee>({
      accessorKey: "employment_type",
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


    ...(customActions
      ? [
          createActionsColumn<Employee>({
            customActions,
          }),
        ]
      : []),
  ];

  const tableData = employees;
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
      <DataTable<Employee>
        data={tableData}
        columns={columns}
        useDefaultColumns={false}
        title="Employees"
        description="Manage and view employees"
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

