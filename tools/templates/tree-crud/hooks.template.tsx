/**
 * {{EntityName}} Hooks
 *
 * React Query hooks for {{entity-name}} operations
 * Provides data fetching, mutations, and query management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  {{EntityName}},
  {{EntityName}}Tree,
  {{EntityName}}Hierarchy,
  Create{{EntityName}}Input,
  Update{{EntityName}}Input,
  {{EntityName}}ListParams,
} from "./types";
import type {{{EntityName}}Service } from "./{{entity-name}}-service";

export function use{{EntityPlural}}(
  service: {{EntityName}}Service,
  params?: {{EntityName}}ListParams
) {
  return useQuery<{ data: {{EntityName}}[]; pagination: any }>({
    queryKey: [
      "{{entity-plural}}",
      params?.parent_id,
      params?.skip,
      params?.limit,
    ],
    queryFn: () => service.fetch{{EntityPlural}}(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function use{{EntityName}}Tree(
  service: {{EntityName}}Service,
  search?: string
) {
  return useQuery<{{EntityName}}Tree[]>({
    queryKey: ["{{entity-plural}}-tree", search],
    queryFn: () => service.fetch{{EntityName}}Tree(search),
    staleTime: 5 * 60 * 1000,
  });
}

export function use{{EntityName}}(
  service: {{EntityName}}Service,
  id: string | null
) {
  return useQuery<{{EntityName}}>({
    queryKey: ["{{entity-name}}", id],
    queryFn: () =>
      id
        ? service.fetch{{EntityName}}(id)
        : Promise.resolve(null as any),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function use{{EntityName}}Hierarchy(
  service: {{EntityName}}Service,
  id: string | null
) {
  return useQuery<{{EntityName}}Hierarchy>({
    queryKey: ["{{entity-name}}-hierarchy", id],
    queryFn: () =>
      id
        ? service.fetch{{EntityName}}Hierarchy(id)
        : Promise.resolve(null as any),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function use{{EntityName}}Children(
  service: {{EntityName}}Service,
  id: string | null
) {
  return useQuery<{{EntityName}}[]>({
    queryKey: ["{{entity-name}}-children", id],
    queryFn: () =>
      id
        ? service.fetch{{EntityName}}Children(id)
        : Promise.resolve([]),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreate{{EntityName}}(service: {{EntityName}}Service) {
  const queryClient = useQueryClient();

  return useMutation<{{EntityName}}, Error, Create{{EntityName}}Input>({
    mutationFn: (input) => service.create{{EntityName}}(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["{{entity-plural}}"] });
      queryClient.invalidateQueries({ queryKey: ["{{entity-plural}}-tree"] });
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["{{entity-plural}}"] });
      queryClient.invalidateQueries({ queryKey: ["{{entity-plural}}-tree"] });
      queryClient.invalidateQueries({ queryKey: ["{{entity-name}}", data.id] });
    },
  });
}

export function useDelete{{EntityName}}(service: {{EntityName}}Service) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.delete{{EntityName}}(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["{{entity-plural}}"] });
      queryClient.invalidateQueries({ queryKey: ["{{entity-plural}}-tree"] });
    },
  });
}
