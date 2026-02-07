import { useCallback } from "react";
import type { UserService } from "@truths/account";
import { mapUserToCommandPaletteItem } from "./mappers";
import type {
  CustomerService,
  EmployeeService,
  BookingService,
} from "@truths/sales";
import type { VenueService, ShowService, OrganizerService } from "@truths/ticketing";

export interface FetchServices {
  userService: UserService;
  customerService: CustomerService;
  employeeService: EmployeeService;
  bookingService: BookingService;
  venueService: VenueService;
  showService: ShowService;
  organizerService: OrganizerService;
}

export const useFetchFunctions = (services: FetchServices) => {
  const {
    userService,
    customerService,
    employeeService,
    bookingService,
    venueService,
    showService,
    organizerService,
  } = services;

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

  const fetchEmployees = useCallback(
    async (query: string) => {
      const employees = await employeeService.searchEmployees(query?.trim(), 10);
      return employees ?? [];
    },
    [employeeService]
  );

  const fetchBookings = useCallback(
    async (query: string) => {
      const bookings = await bookingService.searchBookings(query?.trim(), 10);
      return (bookings ?? []).map((b) => ({ ...b, name: b.booking_number }));
    },
    [bookingService]
  );

  const fetchVenues = useCallback(
    async (query: string) => {
      const venues = await venueService.searchVenues(query?.trim(), 10);
      return venues ?? [];
    },
    [venueService]
  );

  const fetchShows = useCallback(
    async (query: string) => {
      const shows = await showService.searchShows(query?.trim(), 10);
      return shows ?? [];
    },
    [showService]
  );

  const fetchOrganizers = useCallback(
    async (query: string) => {
      const organizers = await organizerService.searchOrganizers(
        query?.trim(),
        10
      );
      return organizers ?? [];
    },
    [organizerService]
  );

  return {
    fetchUsers,
    fetchCustomers,
    fetchEmployees,
    fetchBookings,
    fetchVenues,
    fetchShows,
    fetchOrganizers,
  };
};
