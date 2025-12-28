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
  EventSeat,
  BrokerSeatImportItem,
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

export function useEventSeats(service: EventService, eventId?: string, params?: { skip?: number, limit?: number }) {
  return useQuery<PaginatedResponse<EventSeat>>({
    queryKey: ["events", eventId, "seats", params?.skip, params?.limit],
    queryFn: () => service.fetchEventSeats(eventId!, params),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInitializeEventSeats(service: EventService) {
  const queryClient = useQueryClient();

  return useMutation<EventSeat[], Error, string>({
    mutationFn: (eventId) => service.initializeEventSeats(eventId),
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "seats"] });
    },
  });
}

export function useImportBrokerSeats(service: EventService) {
  const queryClient = useQueryClient();

  return useMutation<EventSeat[], Error, { eventId: string; brokerId: string; seats: BrokerSeatImportItem[] }>({
    mutationFn: ({ eventId, brokerId, seats }) => service.importBrokerSeats(eventId, brokerId, seats),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events", variables.eventId, "seats"] });
    },
  });
}

export function useDeleteEventSeats(service: EventService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { eventId: string; seatIds: string[] }>({
    mutationFn: ({ eventId, seatIds }) => service.deleteEventSeats(eventId, seatIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events", variables.eventId, "seats"] });
    },
  });
}

