/**
 * TestBasic Hooks
 *
 * React Query hooks for test-basic operations
 * Provides data fetching, mutations, and query management
 *
 * @author Phanny
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {TestBasic,
  CreateTestBasicInput,
  UpdateTestBasicInput,
} from "./types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type {TestBasicService } from "./test-basic-service";

export interface UseTestBasicParams {
  search?: string;
  pagination?: Pagination;
  enabled?: boolean;
}

export function useTestBasic(
  service: TestBasicService,
  params?: UseTestBasicParams
) {
  const { search, pagination, enabled = true } = params || {};

  // Normalize search: convert empty string to undefined, trim whitespace
  const normalizedSearch = search?.trim() || undefined;

  return useQuery<PaginatedResponse<TestBasic>>({
    queryKey: [
      "tb",
      normalizedSearch,
      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 100;

      if (normalizedSearch) {
        // Use search endpoint for search queries
        return service.searchTestBasics(normalizedSearch, limit).then((items) => ({
          data: items,
          pagination: {
            page: 1,
            pageSize: limit,
            total: items.length,
            totalPages: 1,
          },
        }));
      }

      return service.fetchTestBasics({
        skip,
        limit,
      });
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTestBasicById(
  service: TestBasicService,
  id: string | null
) {
  return useQuery<TestBasic>({
    queryKey: ["tb", id],
    queryFn: () =>
      id ? service.fetchTestBasicById(id) : Promise.resolve(null as any),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTestBasic(service: TestBasicService) {
  const queryClient = useQueryClient();

  return useMutation<TestBasic, Error, CreateTestBasicInput>({
    mutationFn: (input) => service.createTestBasic(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tb"] });
    },
  });
}

export function useUpdateTestBasic(service: TestBasicService) {
  const queryClient = useQueryClient();

  return useMutation<
    TestBasic,
    Error,
    { id: string; input: UpdateTestBasicInput }
  >({
    mutationFn: ({ id, input }) => service.updateTestBasic(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tb"] });
      queryClient.invalidateQueries({
        queryKey: ["tb", variables.id],
      });
    },
  });
}

export function useDeleteTestBasic(service: TestBasicService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteTestBasic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tb"] });
    },
  });
}
