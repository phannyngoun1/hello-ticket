/**
 * Venue Hooks
 *
 * React Query hooks for venue operations
 * Provides data fetching, mutations, and query management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Venue,
  CreateVenueInput,
  UpdateVenueInput,
  VenueFilter,
} from "./types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type { VenueService } from "./venue-service";

export interface UseVenuesParams {
  filter?: VenueFilter;
  pagination?: Pagination;
}

export function useVenues(service: VenueService, params?: UseVenuesParams) {
  const { filter, pagination } = params || {};

  return useQuery<PaginatedResponse<Venue>>({
    queryKey: [
      "venues",
      filter?.search,

      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 50;

      return service.fetchVenues({
        skip,
        limit,
        search: filter?.search,

      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useVenue(service: VenueService, venueId: string | null) {
  return useQuery<Venue>({
    queryKey: ["venues", venueId],
    queryFn: () =>
      venueId ? service.fetchVenueById(venueId) : Promise.resolve(null as any),
    enabled: !!venueId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateVenue(service: VenueService) {
  const queryClient = useQueryClient();

  return useMutation<Venue, Error, CreateVenueInput>({
    mutationFn: (input) => service.createVenue(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}

export function useUpdateVenue(service: VenueService) {
  const queryClient = useQueryClient();

  return useMutation<Venue, Error, { id: string; input: UpdateVenueInput }>({
    mutationFn: ({ id, input }) => service.updateVenue(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      queryClient.invalidateQueries({ queryKey: ["venues", variables.id] });
    },
  });
}

export function useDeleteVenue(service: VenueService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteVenue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}


