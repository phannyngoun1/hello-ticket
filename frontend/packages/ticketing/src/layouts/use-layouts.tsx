/**
 * Layout Hooks
 *
 * React Query hooks for layout operations
 * Provides data fetching, mutations, and query management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Layout, CreateLayoutInput, UpdateLayoutInput } from "./types";
import type { Seat } from "../seats/types";
import type { LayoutService } from "./layout-service";

export function useLayoutsByVenue(
  service: LayoutService,
  venueId: string | null
) {
  return useQuery({
    queryKey: ["layouts", "venue", venueId],
    queryFn: () => service.fetchLayoutsByVenue(venueId!),
    enabled: !!venueId,
  });
}

export function useLayout(service: LayoutService, layoutId: string | null) {
  return useQuery({
    queryKey: ["layouts", layoutId],
    queryFn: () => service.fetchLayoutById(layoutId!),
    enabled: !!layoutId,
  });
}

export function useLayoutWithSeats(
  service: LayoutService,
  layoutId: string | null
) {
  return useQuery({
    queryKey: ["layouts", layoutId, "with-seats"],
    queryFn: () => service.fetchLayoutWithSeats(layoutId!),
    enabled: !!layoutId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useCreateLayout(service: LayoutService) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLayoutInput) => service.createLayout(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["layouts", "venue", data.venue_id],
      });
    },
  });
}

export function useUpdateLayout(service: LayoutService) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLayoutInput }) =>
      service.updateLayout(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["layouts", data.id] });
      queryClient.invalidateQueries({
        queryKey: ["layouts", "venue", data.venue_id],
      });
    },
  });
}

export function useDeleteLayout(service: LayoutService) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => service.deleteLayout(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["layouts"] });
    },
  });
}

export function useCloneLayout(service: LayoutService) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (layout: Layout) => service.cloneLayout(layout.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["layouts", "venue", data.venue_id],
      });
    },
  });
}
