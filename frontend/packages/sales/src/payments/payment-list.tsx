/**
 * Payment List Component
 *
 * Table view for payments
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
import type { Payment } from "./types";

export interface PaymentListProps {
  className?: string;
  payments?: Payment[];
  loading?: boolean;
  error?: Error | null;
  pagination?: Pagination;
  onPaymentClick?: (payment: Payment) => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function PaymentList({
  className,
  payments = [],
  loading = false,
  error = null,
  pagination,
  onPaymentClick,
  onSearch,
  onPageChange,
  onPageSizeChange,
}: PaymentListProps) {
  const density = useDensityStyles();

  const getDisplayName = (payment: Payment) => {
    return payment.payment_code || payment.id.slice(0, 8).toUpperCase();
  };

  const getInitials = (value: string | undefined) => {
    if (!value) return "?";
    const letters = value.replace(/[^A-Za-z]/g, "");
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    if (value.length >= 2) return value.slice(0, 2).toUpperCase();
    return value.charAt(0).toUpperCase();
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: "bg-green-50 text-green-700 border-green-200",
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      processing: "bg-blue-50 text-blue-700 border-blue-200",
      failed: "bg-red-50 text-red-700 border-red-200",
      refunded: "bg-gray-50 text-gray-700 border-gray-200",
      cancelled: "bg-gray-50 text-gray-700 border-gray-200",
    };

    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
          statusColors[status.toLowerCase()] || "bg-gray-50 text-gray-700 border-gray-200"
        )}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const columns: ColumnDef<Payment>[] = [
    createIdentifiedColumn<Payment>({
      getDisplayName,
      getInitials: (item) => getInitials(item.payment_code || item.id),
      header: "Payment Code",
      showAvatar: false,
      onClick: onPaymentClick,
      additionalOptions: {
        id: "id",
      },
    }),

    createTextColumn<Payment>({
      accessorKey: "booking_id",
      header: "Booking",
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {value ? value.slice(0, 8).toUpperCase() : "-"}
          </span>
        );
      },
    }),

    createTextColumn<Payment>({
      accessorKey: "amount",
      header: "Amount",
      cell: (info) => {
        const payment = info.row.original;
        return (
          <span className={cn("font-semibold", density.textSize)}>
            {formatCurrency(payment.amount, payment.currency)}
          </span>
        );
      },
    }),

    createTextColumn<Payment>({
      accessorKey: "payment_method",
      header: "Method",
      cell: (info) => {
        const method = info.getValue() as string;
        const methodLabels: Record<string, string> = {
          credit_card: "Credit Card",
          debit_card: "Debit Card",
          paypal: "PayPal",
          bank_transfer: "Bank Transfer",
          cash: "Cash",
          other: "Other",
        };
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {methodLabels[method] || method}
          </span>
        );
      },
    }),

    createTextColumn<Payment>({
      accessorKey: "status",
      header: "Status",
      cell: (info) => {
        const status = info.getValue() as string;
        return getStatusBadge(status);
      },
    }),

    createDateTimeColumn<Payment>({
      accessorKey: "created_at",
      header: "Created At",
    }),
  ];

  const tableData = payments;
  const tablePagination = pagination
    ? {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        totalPages: pagination.totalPages,
      }
    : undefined;

  return (
    <div className={cn("space-y-4", className)}>
      <DataTable
        data={tableData}
        columns={columns}
        loading={loading}
        error={error}
        manualPagination={false}
        serverPagination={tablePagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onSearch={onSearch}
        searchPlaceholder="Search payments..."
      />
    </div>
  );
}

