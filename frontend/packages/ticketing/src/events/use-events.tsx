/**
 * Event Hooks
 *
 * React Query hooks for event operations
 * Provides data fetching, mutations, and query management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Event,
  CreateEventInput,
  UpdateEventInput,
  EventFilter,
} from "./types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type { EventService } from "./event-service";

export interface UseEventsParams {
  filter?: EventFilter;
  pagination?: Pagination;
}

export function useEvents(service: EventService, params?: UseEventsParams) {
  const { filter, pagination } = params || {};

  return useQuery<PaginatedResponse<Event>>({
    queryKey: [
      "events",
      filter?.search,
      filter?.is_active,
      filter?.show_id,
      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 50;

      return service.fetchEvents({
        skip,
        limit,
        search: filter?.search,
        is_active: filter?.is_active,
        show_id: filter?.show_id,
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvent(service: EventService, eventId: string | null) {
  return useQuery<Event>({
    queryKey: ["events", eventId],
    queryFn: () =>
      eventId ? service.fetchEventById(eventId) : Promise.resolve(null as any),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEvent(service: EventService) {
  const queryClient = useQueryClient();

  return useMutation<Event, Error, CreateEventInput>({
    mutationFn: (input) => service.createEvent(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      // Also invalidate shows since events are related
      queryClient.invalidateQueries({ queryKey: ["shows"] });
    },
  });
}

export function useUpdateEvent(service: EventService) {
  const queryClient = useQueryClient();

  return useMutation<Event, Error, { id: string; input: UpdateEventInput }>({
    mutationFn: ({ id, input }) => service.updateEvent(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", variables.id] });
    },
  });
}

export function useDeleteEvent(service: EventService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

