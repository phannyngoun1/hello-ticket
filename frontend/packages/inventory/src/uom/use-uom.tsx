/**
 * UoM Hooks
 *
 * React Query hooks for unit of measure operations
 * Provides data fetching, mutations, and query management
 *
 * @author Phanny
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  UnitOfMeasure,
  CreateUnitOfMeasureInput,
  UpdateUnitOfMeasureInput,
} from "../types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type { UoMService } from "./uom-service";

export interface UseUoMParams {
  search?: string;
  pagination?: Pagination;
  enabled?: boolean;
}

export function useUoM(
  service: UoMService,
  params?: UseUoMParams
) {
  const { search, pagination, enabled = true } = params || {};

  return useQuery<PaginatedResponse<UnitOfMeasure>>({
    queryKey: [
      "uom",
      search,
      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 100;

      if (search) {
        // Use search endpoint for search queries
        return service.searchUoM(search, limit).then((items) => ({
          data: items,
          pagination: {
            page: 1,
            pageSize: limit,
            total: items.length,
            totalPages: 1,
          },
        }));
      }

      return service.fetchUoM({
        skip,
        limit,
      });
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUoMById(
  service: UoMService,
  id: string | null
) {
  return useQuery<UnitOfMeasure>({
    queryKey: ["uom", id],
    queryFn: () =>
      id ? service.fetchUoMById(id) : Promise.resolve(null as any),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateUoM(service: UoMService) {
  const queryClient = useQueryClient();

  return useMutation<UnitOfMeasure, Error, CreateUnitOfMeasureInput>({
    mutationFn: (input) => service.createUoM(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uom"] });
    },
  });
}

export function useUpdateUoM(service: UoMService) {
  const queryClient = useQueryClient();

  return useMutation<
    UnitOfMeasure,
    Error,
    { id: string; input: UpdateUnitOfMeasureInput }
  >({
    mutationFn: ({ id, input }) => service.updateUoM(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["uom"] });
      queryClient.invalidateQueries({
        queryKey: ["uom", variables.id],
      });
    },
  });
}

export function useDeleteUoM(service: UoMService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteUoM(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uom"] });
    },
  });
}

