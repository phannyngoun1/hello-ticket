/**
 * EventType Hooks
 *
 * React Query hooks for event-type operations
 * Provides data fetching, mutations, and query management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {EventType,
  CreateEventTypeInput,
  UpdateEventTypeInput,
} from "./types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type {EventTypeService } from "./event-type-service";

export interface UseEventTypeParams {
  search?: string;
  pagination?: Pagination;
  enabled?: boolean;
}

export function useEventType(
  service: EventTypeService,
  params?: UseEventTypeParams
) {
  const { search, pagination, enabled = true } = params || {};

  // Normalize search: convert empty string to undefined, trim whitespace
  const normalizedSearch = search?.trim() || undefined;

  return useQuery<PaginatedResponse<EventType>>({
    queryKey: [
      "et",
      normalizedSearch,
      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 100;

      if (normalizedSearch) {
        // Use search endpoint for search queries
        return service.searchEventTypes(normalizedSearch, limit).then((items) => ({
          data: items,
          pagination: {
            page: 1,
            pageSize: limit,
            total: items.length,
            totalPages: 1,
          },
        }));
      }

      return service.fetchEventTypes({
        skip,
        limit,
      });
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useEventTypeById(
  service: EventTypeService,
  id: string | null
) {
  return useQuery<EventType>({
    queryKey: ["et", id],
    queryFn: () =>
      id ? service.fetchEventTypeById(id) : Promise.resolve(null as any),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEventType(service: EventTypeService) {
  const queryClient = useQueryClient();

  return useMutation<EventType, Error, CreateEventTypeInput>({
    mutationFn: (input) => service.createEventType(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["et"] });
    },
  });
}

export function useUpdateEventType(service: EventTypeService) {
  const queryClient = useQueryClient();

  return useMutation<
    EventType,
    Error,
    { id: string; input: UpdateEventTypeInput }
  >({
    mutationFn: ({ id, input }) => service.updateEventType(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["et"] });
      queryClient.invalidateQueries({
        queryKey: ["et", variables.id],
      });
    },
  });
}

export function useDeleteEventType(service: EventTypeService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteEventType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["et"] });
    },
  });
}
