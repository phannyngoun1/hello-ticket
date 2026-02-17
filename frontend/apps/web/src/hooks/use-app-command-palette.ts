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
  createEmployeeEntityType,
  createBookingEntityType,
  createVenueEntityType,
  createShowEntityType,
  createOrganizerEntityType,
} from "../services/command-palette/entity-type-factories";
import { processNavigationItems } from "../services/command-palette/navigation-utils";
import { getAppQuickActions } from "../services/command-palette/quick-actions";
import type {
  DataTypeConfig,
  BaseDataItem,
  NavigationItem,
  QuickAction,
} from "@truths/custom-ui";
import {
  useCustomerService,
  useEmployeeService,
  useBookingService,
} from "@truths/sales";
import {
  useVenueService,
  useShowService,
  useOrganizerService,
} from "@truths/ticketing";
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
  const customerService = useCustomerService();
  const employeeService = useEmployeeService();
  const bookingService = useBookingService();
  const venueService = useVenueService();
  const showService = useShowService();
  const organizerService = useOrganizerService();
  const navService = useMemo(() => new NavigationService(), []);

  // Fetch current user to get userId for user-specific cache management
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => authService.getCurrentUser(),
    enabled: open, // Only fetch when palette is open
    staleTime: 2 * 60 * 1000, // 2 min - shared with nav, dropdown
  });

  const userId = currentUser?.id || currentUser?.sub || undefined;
  const { data: navItems } = useNavigation(navService, { enabled: !!userId });

  const {
    fetchUsers,
    fetchCustomers,
    fetchEmployees,
    fetchBookings,
    fetchVenues,
    fetchShows,
    fetchOrganizers,
  } = useFetchFunctions({
    userService,
    customerService,
    employeeService,
    bookingService,
    venueService,
    showService,
    organizerService,
  });

  const dataTypes = useMemo(
    () => [
      createUserEntityType(fetchUsers),
      createCustomerEntityType(fetchCustomers),
      createEmployeeEntityType(fetchEmployees),
      createBookingEntityType(fetchBookings),
      createVenueEntityType(fetchVenues),
      createShowEntityType(fetchShows),
      createOrganizerEntityType(fetchOrganizers),
    ],
    [
      fetchUsers,
      fetchCustomers,
      fetchEmployees,
      fetchBookings,
      fetchVenues,
      fetchShows,
      fetchOrganizers,
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

