/**
 * {{EntityName}} Hooks
 *
 * React Query hooks for {{EntityNameLower}} operations
 * Provides data fetching, mutations, and query management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  {{EntityName}},
  Create{{EntityName}}Input,
  Update{{EntityName}}Input,
  {{EntityName}}Filter,
} from "./types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type { {{EntityName}}Service } from "./{{EntityNameLower}}-service";

export interface Use{{EntityNamePlural}}Params {
  filter?: {{EntityName}}Filter;
  pagination?: Pagination;
}

export function use{{EntityNamePlural}}(service: {{EntityName}}Service, params?: Use{{EntityNamePlural}}Params) {
  const { filter, pagination } = params || {};

  return useQuery<PaginatedResponse<{{EntityName}}>>({
    queryKey: [
      "{{EntityNamePluralLower}}",
      filter?.search,
{{FilterQueryKeys}}
      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 50;

      return service.fetch{{EntityNamePlural}}({
        skip,
        limit,
        search: filter?.search,
{{FilterQueryParams}}
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function use{{EntityName}}(service: {{EntityName}}Service, {{EntityNameLower}}Id: string | null) {
  return useQuery<{{EntityName}}>({
    queryKey: ["{{EntityNamePluralLower}}", {{EntityNameLower}}Id],
    queryFn: () =>
      {{EntityNameLower}}Id ? service.fetch{{EntityName}}ById({{EntityNameLower}}Id) : Promise.resolve(null as any),
    enabled: !!{{EntityNameLower}}Id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreate{{EntityName}}(service: {{EntityName}}Service) {
  const queryClient = useQueryClient();

  return useMutation<{{EntityName}}, Error, Create{{EntityName}}Input>({
    mutationFn: (input) => service.create{{EntityName}}(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["{{EntityNamePluralLower}}"] });
    },
  });
}

export function useUpdate{{EntityName}}(service: {{EntityName}}Service) {
  const queryClient = useQueryClient();

  return useMutation<{{EntityName}}, Error, { id: string; input: Update{{EntityName}}Input }>({
    mutationFn: ({ id, input }) => service.update{{EntityName}}(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["{{EntityNamePluralLower}}"] });
      queryClient.invalidateQueries({ queryKey: ["{{EntityNamePluralLower}}", variables.id] });
    },
  });
}

export function useDelete{{EntityName}}(service: {{EntityName}}Service) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.delete{{EntityName}}(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["{{EntityNamePluralLower}}"] });
    },
  });
}
{{ActivateDeactivateHooks}}

