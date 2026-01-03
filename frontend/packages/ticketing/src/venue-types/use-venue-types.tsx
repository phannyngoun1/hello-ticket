/**
 * VenueType Hooks
 *
 * React Query hooks for venue-type operations
 * Provides data fetching, mutations, and query management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {VenueType,
  CreateVenueTypeInput,
  UpdateVenueTypeInput,
} from "./types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type {VenueTypeService } from "./venue-type-service";

export interface UseVenueTypeParams {
  search?: string;
  pagination?: Pagination;
  enabled?: boolean;
}

export function useVenueType(
  service: VenueTypeService,
  params?: UseVenueTypeParams
) {
  const { search, pagination, enabled = true } = params || {};

  // Normalize search: convert empty string to undefined, trim whitespace
  const normalizedSearch = search?.trim() || undefined;

  return useQuery<PaginatedResponse<VenueType>>({
    queryKey: [
      "vt",
      normalizedSearch,
      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 100;

      if (normalizedSearch) {
        // Use search endpoint for search queries
        return service.searchVenueTypes(normalizedSearch, limit).then((items) => ({
          data: items,
          pagination: {
            page: 1,
            pageSize: limit,
            total: items.length,
            totalPages: 1,
          },
        }));
      }

      return service.fetchVenueTypes({
        skip,
        limit,
      });
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useVenueTypeById(
  service: VenueTypeService,
  id: string | null
) {
  return useQuery<VenueType>({
    queryKey: ["vt", id],
    queryFn: () =>
      id ? service.fetchVenueTypeById(id) : Promise.resolve(null as any),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateVenueType(service: VenueTypeService) {
  const queryClient = useQueryClient();

  return useMutation<VenueType, Error, CreateVenueTypeInput>({
    mutationFn: (input) => service.createVenueType(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vt"] });
    },
  });
}

export function useUpdateVenueType(service: VenueTypeService) {
  const queryClient = useQueryClient();

  return useMutation<
    VenueType,
    Error,
    { id: string; input: UpdateVenueTypeInput }
  >({
    mutationFn: ({ id, input }) => service.updateVenueType(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vt"] });
      queryClient.invalidateQueries({
        queryKey: ["vt", variables.id],
      });
    },
  });
}

export function useDeleteVenueType(service: VenueTypeService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteVenueType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vt"] });
    },
  });
}
