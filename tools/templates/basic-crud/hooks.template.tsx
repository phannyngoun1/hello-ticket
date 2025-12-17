/**
 * {{EntityName}} Hooks
 *
 * React Query hooks for {{entity-name}} operations
 * Provides data fetching, mutations, and query management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  {{EntityName}},
  Create{{EntityName}}Input,
  Update{{EntityName}}Input,
} from "./types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type { {{EntityName}}Service } from "./{{entity-name}}-service";

export interface Use{{EntityName}}Params {
  search?: string;
  pagination?: Pagination;
  enabled?: boolean;
}

export function use{{EntityName}}(
  service: {{EntityName}}Service,
  params?: Use{{EntityName}}Params
) {
  const { search, pagination, enabled = true } = params || {};
  
  // Normalize search: convert empty string to undefined, trim whitespace
  const normalizedSearch = search?.trim() || undefined;

  return useQuery<PaginatedResponse<{{EntityName}}>>({
    queryKey: [
      "{{entityVar}}",
      normalizedSearch,
      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 100;

      if (normalizedSearch) {
        // Use search endpoint for search queries
        return service.search{{EntityPlural}}(normalizedSearch, limit).then((items) => ({
          data: items,
          pagination: {
            page: 1,
            pageSize: limit,
            total: items.length,
            totalPages: 1,
          },
        }));
      }

      return service.fetch{{EntityPlural}}({
        skip,
        limit,
      });
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function use{{EntityName}}ById(
  service: {{EntityName}}Service,
  id: string | null
) {
  return useQuery<{{EntityName}}>({
    queryKey: ["{{entityVar}}", id],
    queryFn: () =>
      id ? service.fetch{{EntityName}}ById(id) : Promise.resolve(null as any),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreate{{EntityName}}(service: {{EntityName}}Service) {
  const queryClient = useQueryClient();

  return useMutation<{{EntityName}}, Error, Create{{EntityName}}Input>({
    mutationFn: (input) => service.create{{EntityName}}(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["{{entityVar}}"] });
    },
  });
}

export function useUpdate{{EntityName}}(service: {{EntityName}}Service) {
  const queryClient = useQueryClient();

  return useMutation<
    {{EntityName}},
    Error,
    { id: string; input: Update{{EntityName}}Input }
  >({
    mutationFn: ({ id, input }) => service.update{{EntityName}}(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["{{entityVar}}"] });
      queryClient.invalidateQueries({
        queryKey: ["{{entityVar}}", variables.id],
      });
    },
  });
}

export function useDelete{{EntityName}}(service: {{EntityName}}Service) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.delete{{EntityName}}(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["{{entityVar}}"] });
    },
  });
}

