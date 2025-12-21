import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { UserService } from "@truths/account";
import {
  mapUserToCommandPaletteItem,
} from "./mappers";
import { CustomerService } from "@truths/sales";

export const useFetchFunctions = (
  userService: UserService,
  customerService: CustomerService
) => {
  const queryClient = useQueryClient();

  const fetchUsers = useCallback(
    async (query: string) => {
      const users = await userService.searchUsers(query?.trim(), 10);
      return (users ?? []).map(mapUserToCommandPaletteItem);
    },
    [userService]
  );

  const fetchCustomers = useCallback(
    async (query: string) => {
      const response = await customerService.fetchCustomers({
        search: query?.trim(),
        skip: 0,
        limit: 10,
      });
      return response.data ?? [];
    },
    [customerService]
  );

  return {
    fetchUsers,
    fetchCustomers,
  };
};
