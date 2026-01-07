/**
 * Payment List Container
 *
 * Integrates the payment list with service hooks
 */

import { useCallback, useMemo, useState } from "react";
import type { Pagination } from "@truths/shared";
import { PaymentList } from "./payment-list";
import { PaymentDetailDialog } from "./payment-detail-dialog";
import type { Payment } from "./types";
import { PaymentService } from "./payment-service";
import { api } from "@truths/api";
import { useQuery } from "@tanstack/react-query";

export interface PaymentListContainerProps {
  onNavigateToPayment?: (id: string) => void;
}

export function PaymentListContainer({
  // onNavigateToPayment,
}: PaymentListContainerProps) {
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 50 });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

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

  // Fetch all payments
  // TODO: Add pagination support to the backend API
  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ["payments", "all"],
    queryFn: async () => {
      return paymentService.getAllPayments();
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

  const handleViewPayment = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setDetailDialogOpen(true);
  }, []);

  // Calculate pagination with total and totalPages
  const paginationWithTotal = useMemo(() => {
    const total = payments.length;
    return {
      ...pagination,
      total,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }, [pagination, payments.length]);

  return (
    <>
      <PaymentList
        payments={payments}
        loading={isLoading}
        error={error as Error | null}
        onPaymentClick={handleViewPayment}
        onSearch={handleSearch}
        pagination={paginationWithTotal}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <PaymentDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        payment={selectedPayment}
      />
    </>
  );
}

