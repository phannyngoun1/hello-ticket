/**
 * Payment Hooks
 *
 * React Query hooks for payment operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Payment, CreatePaymentInput } from "./types";
import type { PaymentService } from "./payment-service";

export function useCreatePayment(service: PaymentService) {
  const queryClient = useQueryClient();

  return useMutation<Payment, Error, CreatePaymentInput>({
    mutationFn: (input) => service.createPayment(input),
    onSuccess: (data) => {
      // Invalidate bookings to refresh payment status
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      // Invalidate payments for this booking
      queryClient.invalidateQueries({ queryKey: ["payments", "booking", data.booking_id] });
      // Invalidate event seats so seat status (sold) updates immediately in Event Inventory
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function usePayment(service: PaymentService, paymentId: string | null) {
  return useQuery<Payment, Error>({
    queryKey: ["payments", "detail", paymentId],
    queryFn: () => (paymentId ? service.getPaymentById(paymentId) : Promise.reject(new Error("No payment ID"))),
    enabled: !!paymentId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePaymentsByBooking(service: PaymentService, bookingId: string | null) {
  return useQuery<Payment[]>({
    queryKey: ["payments", "booking", bookingId],
    queryFn: () => (bookingId ? service.getPaymentsByBooking(bookingId) : Promise.resolve([])),
    enabled: !!bookingId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVoidPayment(service: PaymentService) {
  const queryClient = useQueryClient();

  return useMutation<Payment, Error, string>({
    mutationFn: (paymentId) => service.voidPayment(paymentId),
    onSuccess: (data) => {
      // Invalidate bookings to refresh payment status
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      // Invalidate payments for this booking
      queryClient.invalidateQueries({ queryKey: ["payments", "booking", data.booking_id] });
      // Invalidate event seats so seat status updates after void (e.g. back to available)
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

