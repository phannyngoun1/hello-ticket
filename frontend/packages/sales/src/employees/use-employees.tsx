/**
 * Employee Hooks
 *
 * React Query hooks for employee operations
 * Provides data fetching, mutations, and query management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Employee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeFilter,
} from "./types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type { EmployeeService } from "./employee-service";

export interface UseEmployeesParams {
  filter?: EmployeeFilter;
  pagination?: Pagination;
}

export function useEmployees(service: EmployeeService, params?: UseEmployeesParams) {
  const { filter, pagination } = params || {};

  return useQuery<PaginatedResponse<Employee>>({
    queryKey: [
      "employees",
      filter?.search,

      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 50;

      return service.fetchEmployees({
        skip,
        limit,
        search: filter?.search,

      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmployee(service: EmployeeService, employeeId: string | null) {
  return useQuery<Employee>({
    queryKey: ["employees", employeeId],
    queryFn: () =>
      employeeId ? service.fetchEmployeeById(employeeId) : Promise.resolve(null as any),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEmployee(service: EmployeeService) {
  const queryClient = useQueryClient();

  return useMutation<Employee, Error, CreateEmployeeInput>({
    mutationFn: (input) => service.createEmployee(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateEmployee(service: EmployeeService) {
  const queryClient = useQueryClient();

  return useMutation<Employee, Error, { id: string; input: UpdateEmployeeInput }>({
    mutationFn: ({ id, input }) => service.updateEmployee(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees", variables.id] });
    },
  });
}

export function useDeleteEmployee(service: EmployeeService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}


