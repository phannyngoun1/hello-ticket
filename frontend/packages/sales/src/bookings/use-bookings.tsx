/**
 * Booking Hooks
 *
 * React Query hooks for booking operations
 * Provides data fetching, mutations, and query management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Booking,
  CreateBookingInput,
  UpdateBookingInput,
  BookingFilter,
} from "./types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type { BookingService } from "./booking-service";

export interface UseBookingsParams {
  filter?: BookingFilter;
  pagination?: Pagination;
}

export function useBookings(service: BookingService, params?: UseBookingsParams) {
  const { filter, pagination } = params || {};

  return useQuery<PaginatedResponse<Booking>>({
    queryKey: [
      "bookings",
      filter?.search,

      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 50;

      return service.fetchBookings({
        skip,
        limit,
        search: filter?.search,

      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBooking(service: BookingService, bookingId: string | null) {
  return useQuery<Booking>({
    queryKey: ["bookings", bookingId],
    queryFn: () =>
      bookingId ? service.fetchBookingById(bookingId) : Promise.resolve(null as any),
    enabled: !!bookingId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBooking(service: BookingService) {
  const queryClient = useQueryClient();

  return useMutation<Booking, Error, CreateBookingInput>({
    mutationFn: (input) => service.createBooking(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useUpdateBooking(service: BookingService) {
  const queryClient = useQueryClient();

  return useMutation<Booking, Error, { id: string; input: UpdateBookingInput }>({
    mutationFn: ({ id, input }) => service.updateBooking(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", variables.id] });
    },
  });
}

export function useDeleteBooking(service: BookingService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}


