/**
 * Item Hooks
 *
 * React Query hooks for item operations
 * Provides data fetching, mutations, and query management
 *
 * @author Phanny
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Item,
  CreateItemInput,
  UpdateItemInput,
  ItemFilter,
} from "../types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type { ItemService } from "./item-service";

export interface UseItemsParams {
  filter?: ItemFilter;
  pagination?: Pagination;
}

export function useItems(service: ItemService, params?: UseItemsParams) {
  const { filter, pagination } = params || {};

  return useQuery<PaginatedResponse<Item>>({
    queryKey: ["items", filter?.search, pagination?.page, pagination?.pageSize],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 50;

      return service.fetchItems({
        skip,
        limit,
        search: filter?.search,
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useItem(service: ItemService, itemId: string | null) {
  return useQuery<Item>({
    queryKey: ["item", itemId],
    queryFn: () =>
      itemId ? service.fetchItem(itemId) : Promise.resolve(null as any),
    enabled: !!itemId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateItem(service: ItemService) {
  const queryClient = useQueryClient();

  return useMutation<Item, Error, CreateItemInput>({
    mutationFn: (input) => service.createItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useUpdateItem(service: ItemService) {
  const queryClient = useQueryClient();

  return useMutation<Item, Error, { id: string; input: UpdateItemInput }>({
    mutationFn: ({ id, input }) => service.updateItem(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["item", data.id] });
    },
  });
}

export function useDeleteItem(service: ItemService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export interface ItemBalance {
  id: string;
  tenant_id: string;
  item_id: string;
  location_id: string;
  tracking_id?: string | null;
  status: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export function useItemBalances(
  service: ItemService,
  itemId: string | null,
  options?: {
    locationId?: string;
    status?: string;
  }
) {
  return useQuery<ItemBalance[]>({
    queryKey: ["item-balances", itemId, options?.locationId, options?.status],
    queryFn: () =>
      itemId
        ? service.fetchItemBalances(
            itemId,
            options?.locationId,
            options?.status
          )
        : Promise.resolve([]),
    enabled: !!itemId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
