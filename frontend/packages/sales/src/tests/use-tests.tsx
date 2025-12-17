/**
 * Test Hooks
 *
 * React Query hooks for test operations
 * Provides data fetching, mutations, and query management
 *
 * @author Phanny
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Test,
  CreateTestInput,
  UpdateTestInput,
  TestFilter,
} from "./types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type { TestService } from "./test-service";

export interface UseTestsParams {
  filter?: TestFilter;
  pagination?: Pagination;
}

export function useTests(service: TestService, params?: UseTestsParams) {
  const { filter, pagination } = params || {};

  return useQuery<PaginatedResponse<Test>>({
    queryKey: [
      "tests",
      filter?.search,

      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 50;

      return service.fetchTests({
        skip,
        limit,
        search: filter?.search,

      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTest(service: TestService, testId: string | null) {
  return useQuery<Test>({
    queryKey: ["tests", testId],
    queryFn: () =>
      testId ? service.fetchTestById(testId) : Promise.resolve(null as any),
    enabled: !!testId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTest(service: TestService) {
  const queryClient = useQueryClient();

  return useMutation<Test, Error, CreateTestInput>({
    mutationFn: (input) => service.createTest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });
}

export function useUpdateTest(service: TestService) {
  const queryClient = useQueryClient();

  return useMutation<Test, Error, { id: string; input: UpdateTestInput }>({
    mutationFn: ({ id, input }) => service.updateTest(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.invalidateQueries({ queryKey: ["tests", variables.id] });
    },
  });
}

export function useDeleteTest(service: TestService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteTest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });
}


