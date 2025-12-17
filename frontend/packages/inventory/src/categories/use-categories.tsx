/**
 * Category Hooks
 *
 * React Query hooks for category operations
 * Provides data fetching, mutations, and query management
 *
 * @author Phanny
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ItemCategory,
  ItemCategoryTree,
  ItemCategoryHierarchy,
  CreateItemCategoryInput,
  UpdateItemCategoryInput,
} from "../types";
import type { CategoryService } from "./category-service";

export function useCategories(
  service: CategoryService,
  params?: {
    parent_category_id?: string;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }
) {
  return useQuery<ItemCategory[]>({
    queryKey: [
      "categories",
      params?.parent_category_id,
      params?.is_active,
      params?.skip,
      params?.limit,
    ],
    queryFn: () => service.fetchCategories(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCategoryTree(service: CategoryService) {
  return useQuery<ItemCategoryTree[]>({
    queryKey: ["categories-tree"],
    queryFn: () => service.getCategoryTree(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategory(
  service: CategoryService,
  categoryId: string | null
) {
  return useQuery<ItemCategory>({
    queryKey: ["category", categoryId],
    queryFn: () =>
      categoryId
        ? service.fetchCategory(categoryId)
        : Promise.resolve(null as any),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryHierarchy(
  service: CategoryService,
  categoryId: string | null
) {
  return useQuery<ItemCategoryHierarchy>({
    queryKey: ["category-hierarchy", categoryId],
    queryFn: () =>
      categoryId
        ? service.getCategoryHierarchy(categoryId)
        : Promise.resolve(null as any),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryChildren(
  service: CategoryService,
  categoryId: string | null
) {
  return useQuery<ItemCategory[]>({
    queryKey: ["category-children", categoryId],
    queryFn: () =>
      categoryId
        ? service.getCategoryChildren(categoryId)
        : Promise.resolve([]),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCategory(service: CategoryService) {
  const queryClient = useQueryClient();

  return useMutation<ItemCategory, Error, CreateItemCategoryInput>({
    mutationFn: (input) => service.createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-tree"] });
    },
  });
}

export function useUpdateCategory(service: CategoryService) {
  const queryClient = useQueryClient();

  return useMutation<
    ItemCategory,
    Error,
    { id: string; input: UpdateItemCategoryInput }
  >({
    mutationFn: ({ id, input }) => service.updateCategory(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-tree"] });
      queryClient.invalidateQueries({ queryKey: ["category", data.id] });
    },
  });
}

export function useDeleteCategory(service: CategoryService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-tree"] });
    },
  });
}

