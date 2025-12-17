/**
 * User Hooks
 *
 * React Query hooks for user operations
 * Provides data fetching, mutations, and query management
 *
 * @author Phanny
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserFilter,
} from "../types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type { UserService } from "./user-service";

export interface UseUsersParams {
  filter?: UserFilter;
  pagination?: Pagination;
}

export function useUsers(service: UserService, params?: UseUsersParams) {
  const { filter, pagination } = params || {};

  return useQuery<PaginatedResponse<User>>({
    queryKey: [
      "users",
      filter?.search,
      filter?.role,
      filter?.status,
      filter?.createdAfter?.toISOString(),
      filter?.createdBefore?.toISOString(),
      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 50;

      return service.fetchUsers({
        skip,
        limit,
        search: filter?.search,
        role: filter?.role,
        status: filter?.status,
        createdAfter: filter?.createdAfter,
        createdBefore: filter?.createdBefore,
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUser(service: UserService, userId: string | null) {
  return useQuery<User>({
    queryKey: ["user", userId],
    queryFn: () =>
      userId ? service.fetchUser(userId) : Promise.resolve(null as any),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateUser(service: UserService) {
  const queryClient = useQueryClient();

  return useMutation<User, Error, CreateUserInput>({
    mutationFn: (input) => service.createUser(input),
    onSuccess: () => {
      // Invalidate users list to refetch with new user
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser(service: UserService) {
  const queryClient = useQueryClient();

  return useMutation<User, Error, { id: string; input: UpdateUserInput }>({
    mutationFn: ({ id, input }) => service.updateUser(id, input),
    onSuccess: (_data, variables) => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // Invalidate specific user
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      // Invalidate activity cache to show new audit events (safe - no-op if query doesn't exist)
      queryClient.invalidateQueries({
        queryKey: ["user-activity", variables.id],
      });
    },
  });
}

export function useDeleteUser(service: UserService) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteUser(id),
    onSuccess: () => {
      // Invalidate users list to remove deleted user
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useLockUser(service: UserService) {
  const queryClient = useQueryClient();

  return useMutation<User, Error, string>({
    mutationFn: (id) => service.lockUser(id, 60),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["user-activity", id] });
    },
  });
}

export function useUnlockUser(service: UserService) {
  const queryClient = useQueryClient();

  return useMutation<User, Error, string>({
    mutationFn: (id) => service.unlockUser(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["user-activity", id] });
    },
  });
}

export function useActivateUser(service: UserService) {
  const queryClient = useQueryClient();

  return useMutation<User, Error, string>({
    mutationFn: (id) => service.activateUser(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["user-activity", id] });
    },
  });
}

export function useDeactivateUser(service: UserService) {
  const queryClient = useQueryClient();

  return useMutation<User, Error, string>({
    mutationFn: (id) => service.deactivateUser(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["user-activity", id] });
    },
  });
}
