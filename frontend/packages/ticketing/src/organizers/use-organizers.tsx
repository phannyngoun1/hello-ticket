/**
 * Organizer Hooks
 *
 * React Query hooks for organizer operations
 * Provides data fetching, mutations, and query management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Organizer,
  CreateOrganizerInput,
  UpdateOrganizerInput,
  OrganizerFilter,
} from "./types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type { OrganizerService } from "./organizer-service";

export interface UseOrganizersParams {
  filter?: OrganizerFilter;
  pagination?: Pagination;
}

export function useOrganizers(service: OrganizerService, params?: UseOrganizersParams) {
  const { filter, pagination } = params || {};

  return useQuery<PaginatedResponse<Organizer>>({
    queryKey: [
      "organizers",
      filter?.search,

      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 50;

      return service.fetchOrganizers({
        skip,
        limit,
        search: filter?.search,

      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrganizer(service: OrganizerService, organizerId: string | null) {
  return useQuery<Organizer>({
    queryKey: ["organizers", organizerId],
    queryFn: () =>
      organizerId ? service.fetchOrganizerById(organizerId) : Promise.resolve(null as any),
    enabled: !!organizerId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateOrganizer(service: OrganizerService) {
  const queryClient = useQueryClient();

  return useMutation<Organizer, Error, CreateOrganizerInput>({
    mutationFn: (input) => service.createOrganizer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizers"] });
    },
  });
}

export function useUpdateOrganizer(service: OrganizerService) {
  const queryClient = useQueryClient();

  return useMutation<Organizer, Error, { id: string; input: UpdateOrganizerInput }>({
    mutationFn: ({ id, input }) => service.updateOrganizer(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organizers"] });
      queryClient.invalidateQueries({ queryKey: ["organizers", variables.id] });
    },
  });
}

export function useDeleteOrganizer(service: OrganizerService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteOrganizer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizers"] });
    },
  });
}


