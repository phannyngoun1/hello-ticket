/**
 * Customer Hooks
 *
 * React Query hooks for customer operations
 * Provides data fetching, mutations, and query management
 *
 * @author Phanny
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilter,
} from "../types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type { CustomerService } from "./customer-service";

export interface UseCustomersParams {
  filter?: CustomerFilter;
  pagination?: Pagination;
}

export function useCustomers(service: CustomerService, params?: UseCustomersParams) {
  const { filter, pagination } = params || {};

  return useQuery<PaginatedResponse<Customer>>({
    queryKey: [
      "customers",
      filter?.search,

      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 50;

      return service.fetchCustomers({
        skip,
        limit,
        search: filter?.search,

      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomer(service: CustomerService, customerId: string | null) {
  return useQuery<Customer>({
    queryKey: ["customer", customerId],
    queryFn: () =>
      customerId ? service.fetchCustomer(customerId) : Promise.resolve(null as any),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCustomer(service: CustomerService) {
  const queryClient = useQueryClient();

  return useMutation<Customer, Error, CreateCustomerInput>({
    mutationFn: (input) => service.createCustomer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer(service: CustomerService) {
  const queryClient = useQueryClient();

  return useMutation<Customer, Error, { id: string; input: UpdateCustomerInput }>({
    mutationFn: ({ id, input }) => service.updateCustomer(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });
    },
  });
}

export function useDeleteCustomer(service: CustomerService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
