/**
 * TestTree Hooks
 *
 * React Query hooks for test-tree operations
 * Provides data fetching, mutations, and query management
 *
 * @author Phanny
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  TestTree,
  TestTreeTree,
  TestTreeHierarchy,
  CreateTestTreeInput,
  UpdateTestTreeInput,
  TestTreeListParams,
} from "./types";
import type {TestTreeService } from "./test-tree-service";

export function useTestTrees(
  service: TestTreeService,
  params?: TestTreeListParams
) {
  return useQuery<{ data: TestTree[]; pagination: any }>({
    queryKey: [
      "test-trees",
      params?.parent_id,
      params?.skip,
      params?.limit,
    ],
    queryFn: () => service.fetchTestTrees(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTestTreeTree(
  service: TestTreeService,
  search?: string
) {
  return useQuery<TestTreeTree[]>({
    queryKey: ["test-trees-tree", search],
    queryFn: () => service.fetchTestTreeTree(search),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTestTree(
  service: TestTreeService,
  id: string | null
) {
  return useQuery<TestTree>({
    queryKey: ["test-tree", id],
    queryFn: () =>
      id
        ? service.fetchTestTree(id)
        : Promise.resolve(null as any),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTestTreeHierarchy(
  service: TestTreeService,
  id: string | null
) {
  return useQuery<TestTreeHierarchy>({
    queryKey: ["test-tree-hierarchy", id],
    queryFn: () =>
      id
        ? service.fetchTestTreeHierarchy(id)
        : Promise.resolve(null as any),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTestTreeChildren(
  service: TestTreeService,
  id: string | null
) {
  return useQuery<TestTree[]>({
    queryKey: ["test-tree-children", id],
    queryFn: () =>
      id
        ? service.fetchTestTreeChildren(id)
        : Promise.resolve([]),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTestTree(service: TestTreeService) {
  const queryClient = useQueryClient();

  return useMutation<TestTree, Error, CreateTestTreeInput>({
    mutationFn: (input) => service.createTestTree(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-trees"] });
      queryClient.invalidateQueries({ queryKey: ["test-trees-tree"] });
    },
  });
}

export function useUpdateTestTree(service: TestTreeService) {
  const queryClient = useQueryClient();

  return useMutation<
    TestTree,
    Error,
    { id: string; input: UpdateTestTreeInput }
  >({
    mutationFn: ({ id, input }) => service.updateTestTree(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["test-trees"] });
      queryClient.invalidateQueries({ queryKey: ["test-trees-tree"] });
      queryClient.invalidateQueries({ queryKey: ["test-tree", data.id] });
    },
  });
}

export function useDeleteTestTree(service: TestTreeService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteTestTree(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-trees"] });
      queryClient.invalidateQueries({ queryKey: ["test-trees-tree"] });
    },
  });
}
