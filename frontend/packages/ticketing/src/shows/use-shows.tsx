/**
 * Show Hooks
 *
 * React Query hooks for show operations
 * Provides data fetching, mutations, and query management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Show,
  CreateShowInput,
  UpdateShowInput,
  ShowFilter,
} from "./types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type { ShowService } from "./show-service";

export interface UseShowsParams {
  filter?: ShowFilter;
  pagination?: Pagination;
}

export function useShows(service: ShowService, params?: UseShowsParams) {
  const { filter, pagination } = params || {};

  return useQuery<PaginatedResponse<Show>>({
    queryKey: [
      "shows",
      filter?.search,

      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 50;

      return service.fetchShows({
        skip,
        limit,
        search: filter?.search,

      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useShow(service: ShowService, showId: string | null) {
  return useQuery<Show>({
    queryKey: ["shows", showId],
    queryFn: () =>
      showId ? service.fetchShowById(showId) : Promise.resolve(null as any),
    enabled: !!showId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateShow(service: ShowService) {
  const queryClient = useQueryClient();

  return useMutation<Show, Error, CreateShowInput>({
    mutationFn: (input) => service.createShow(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
    },
  });
}

export function useUpdateShow(service: ShowService) {
  const queryClient = useQueryClient();

  return useMutation<Show, Error, { id: string; input: UpdateShowInput }>({
    mutationFn: ({ id, input }) => service.updateShow(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
      queryClient.invalidateQueries({ queryKey: ["shows", variables.id] });
    },
  });
}

export function useDeleteShow(service: ShowService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteShow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
    },
  });
}


