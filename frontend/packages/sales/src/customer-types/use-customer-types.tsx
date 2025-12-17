/**
 * CustomerType Hooks
 *
 * React Query hooks for customer-type operations
 * Provides data fetching, mutations, and query management
 *
 * @author Phanny
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {CustomerType,
  CreateCustomerTypeInput,
  UpdateCustomerTypeInput,
} from "./types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type {CustomerTypeService } from "./customer-type-service";

export interface UseCustomerTypeParams {
  search?: string;
  pagination?: Pagination;
  enabled?: boolean;
}

export function useCustomerType(
  service: CustomerTypeService,
  params?: UseCustomerTypeParams
) {
  const { search, pagination, enabled = true } = params || {};

  // Normalize search: convert empty string to undefined, trim whitespace
  const normalizedSearch = search?.trim() || undefined;

  return useQuery<PaginatedResponse<CustomerType>>({
    queryKey: [
      "ct",
      normalizedSearch,
      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 100;

      if (normalizedSearch) {
        // Use search endpoint for search queries
        return service.searchCustomerTypes(normalizedSearch, limit).then((items) => ({
          data: items,
          pagination: {
            page: 1,
            pageSize: limit,
            total: items.length,
            totalPages: 1,
          },
        }));
      }

      return service.fetchCustomerTypes({
        skip,
        limit,
      });
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCustomerTypeById(
  service: CustomerTypeService,
  id: string | null
) {
  return useQuery<CustomerType>({
    queryKey: ["ct", id],
    queryFn: () =>
      id ? service.fetchCustomerTypeById(id) : Promise.resolve(null as any),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCustomerType(service: CustomerTypeService) {
  const queryClient = useQueryClient();

  return useMutation<CustomerType, Error, CreateCustomerTypeInput>({
    mutationFn: (input) => service.createCustomerType(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ct"] });
    },
  });
}

export function useUpdateCustomerType(service: CustomerTypeService) {
  const queryClient = useQueryClient();

  return useMutation<
    CustomerType,
    Error,
    { id: string; input: UpdateCustomerTypeInput }
  >({
    mutationFn: ({ id, input }) => service.updateCustomerType(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ct"] });
      queryClient.invalidateQueries({
        queryKey: ["ct", variables.id],
      });
    },
  });
}

export function useDeleteCustomerType(service: CustomerTypeService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteCustomerType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ct"] });
    },
  });
}
