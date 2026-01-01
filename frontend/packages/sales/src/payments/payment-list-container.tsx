/**
 * Payment List Container
 *
 * Integrates the payment list with service hooks
 */

import React, { useCallback, useMemo, useState } from "react";
import { toast } from "@truths/ui";
import type { Pagination } from "@truths/shared";
import { PaymentList } from "./payment-list";
import { PaymentService } from "./payment-service";
import { api } from "@truths/api";
import { useQuery } from "@tanstack/react-query";

export interface PaymentListContainerProps {
  onNavigateToPayment?: (id: string) => void;
}

export function PaymentListContainer({
  onNavigateToPayment,
}: PaymentListContainerProps) {
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 50 });

  // Create payment service
  const paymentService = useMemo(
    () =>
      new PaymentService({
        apiClient: api,
        endpoints: {
          payments: "/api/v1/sales/payments",
        },
      }),
    []
  );

  // For now, we'll need to fetch all payments
  // TODO: Add pagination support to the backend API
  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ["payments", "all"],
    queryFn: async () => {
      // Since we don't have a list endpoint yet, we'll return empty for now
      // This can be enhanced when backend supports payment listing
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = useCallback((query: string) => {
    // TODO: Implement search when backend supports it
    console.log("Search payments:", query);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination({ page: 1, pageSize });
  }, []);

  const handleNavigateToPayment = useCallback(
    (payment: import("./types").Payment) => {
      onNavigateToPayment?.(payment.id);
    },
    [onNavigateToPayment]
  );

  return (
    <PaymentList
      payments={payments}
      loading={isLoading}
      error={error as Error | null}
      onPaymentClick={handleNavigateToPayment}
      onSearch={handleSearch}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    />
  );
}

