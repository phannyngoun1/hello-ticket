import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserService } from "@truths/account";
import { authService } from "../services/auth-service";
import { NavigationService } from "../services/navigation-service";
import { useNavigation } from "./use-navigation";
import { useFetchFunctions } from "../services/command-palette/fetch-functions";
import {
  createUserEntityType,
  createCustomerEntityType,
} from "../services/command-palette/entity-type-factories";
import { processNavigationItems } from "../services/command-palette/navigation-utils";
import { getAppQuickActions } from "../services/command-palette/quick-actions";
import type { DataTypeConfig, BaseDataItem, NavigationItem, QuickAction } from "@truths/custom-ui";
import { useCustomerService } from "@truths/sales";
import { useNavigate } from "@tanstack/react-router";

export interface UseAppCommandPaletteResult {
  dataTypes: DataTypeConfig<BaseDataItem>[];
  navigationItems: NavigationItem[] | undefined;
  quickActions: QuickAction[];
  userId: string | undefined;
}

export function useAppCommandPalette(
  open: boolean
): UseAppCommandPaletteResult {
  const navigate = useNavigate();
  const userService = useUserService();
  const navService = useMemo(() => new NavigationService(), []);
  const customerService = useCustomerService();

  // Fetch current user to get userId for user-specific cache management
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => authService.getCurrentUser(),
    enabled: open, // Only fetch when palette is open
  });

  const userId = currentUser?.id || currentUser?.sub || undefined;
  const { data: navItems } = useNavigation(navService, { enabled: !!userId });

  const { fetchUsers, fetchCustomers } =
    useFetchFunctions(
      userService,
      customerService
    );

  const dataTypes = useMemo(
    () => [
      createUserEntityType(fetchUsers),
      createCustomerEntityType(fetchCustomers),
    ],
    [
      fetchUsers,
      fetchCustomers,
    ]
  );

  const navigationItems = useMemo(
    () => processNavigationItems(navItems),
    [navItems]
  );

  const quickActions = useMemo(
    () => getAppQuickActions(navigate),
    [navigate]
  );

  return {
    dataTypes,
    navigationItems,
    quickActions,
    userId,
  };
}

