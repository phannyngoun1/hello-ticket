/**
 * CustomerGroup Hooks
 *
 * React Query hooks for customer-group operations
 * Provides data fetching, mutations, and query management
 *
 * @author Phanny
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CustomerGroup,
  CustomerGroupTree,
  CustomerGroupHierarchy,
  CreateCustomerGroupInput,
  UpdateCustomerGroupInput,
  CustomerGroupListParams,
} from "./types";
import type {CustomerGroupService } from "./customer-group-service";

export function useCustomerGroups(
  service: CustomerGroupService,
  params?: CustomerGroupListParams
) {
  return useQuery<{ data: CustomerGroup[]; pagination: any }>({
    queryKey: [
      "customer-groups",
      params?.parent_id,
      params?.skip,
      params?.limit,
    ],
    queryFn: () => service.fetchCustomerGroups(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCustomerGroupTree(
  service: CustomerGroupService
) {
  return useQuery<CustomerGroupTree[]>({
    queryKey: ["customer-groups-tree"],
    queryFn: () => service.fetchCustomerGroupTree(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomerGroup(
  service: CustomerGroupService,
  id: string | null
) {
  return useQuery<CustomerGroup>({
    queryKey: ["customer-group", id],
    queryFn: () =>
      id
        ? service.fetchCustomerGroup(id)
        : Promise.resolve(null as any),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomerGroupHierarchy(
  service: CustomerGroupService,
  id: string | null
) {
  return useQuery<CustomerGroupHierarchy>({
    queryKey: ["customer-group-hierarchy", id],
    queryFn: () =>
      id
        ? service.fetchCustomerGroupHierarchy(id)
        : Promise.resolve(null as any),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomerGroupChildren(
  service: CustomerGroupService,
  id: string | null
) {
  return useQuery<CustomerGroup[]>({
    queryKey: ["customer-group-children", id],
    queryFn: () =>
      id
        ? service.fetchCustomerGroupChildren(id)
        : Promise.resolve([]),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCustomerGroup(service: CustomerGroupService) {
  const queryClient = useQueryClient();

  return useMutation<CustomerGroup, Error, CreateCustomerGroupInput>({
    mutationFn: (input) => service.createCustomerGroup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-groups"] });
      queryClient.invalidateQueries({ queryKey: ["customer-groups-tree"] });
    },
  });
}

export function useUpdateCustomerGroup(service: CustomerGroupService) {
  const queryClient = useQueryClient();

  return useMutation<
    CustomerGroup,
    Error,
    { id: string; input: UpdateCustomerGroupInput }
  >({
    mutationFn: ({ id, input }) => service.updateCustomerGroup(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customer-groups"] });
      queryClient.invalidateQueries({ queryKey: ["customer-groups-tree"] });
      queryClient.invalidateQueries({ queryKey: ["customer-group", data.id] });
    },
  });
}

export function useDeleteCustomerGroup(service: CustomerGroupService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteCustomerGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-groups"] });
      queryClient.invalidateQueries({ queryKey: ["customer-groups-tree"] });
    },
  });
}
