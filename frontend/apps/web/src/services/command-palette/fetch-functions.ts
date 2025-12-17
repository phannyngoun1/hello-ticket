import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { UserService } from "@truths/account";
import type { ItemService } from "@truths/inventory";
import {
  mapUserToCommandPaletteItem,
} from "./mappers";
import { CustomerService } from "@truths/sales";

export const useFetchFunctions = (
  userService: UserService,
  itemService: ItemService,
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

  const fetchInventoryItems = useCallback(
    async (query: string) => {
      const response = await itemService.fetchItems({
        search: query?.trim(),
        limit: 10,
      });
      return response.data ?? [];
    },
    [itemService]
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
    fetchInventoryItems,
    fetchCustomers,
  };
};
