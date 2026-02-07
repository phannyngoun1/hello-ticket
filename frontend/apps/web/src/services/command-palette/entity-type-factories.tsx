import {
  User,
  Users,
  UserRound,
  Ticket,
  Building2,
  Film,
  Store,
} from "lucide-react";
import type { DataTypeConfig, BaseDataItem } from "@truths/custom-ui";
import type { CommandPaletteUser } from "./types";
import { nameExtractors } from "./mappers";
import { DefaultAppCommandPaletteItem } from "../../components/app-command-palette/default-app-command-palette-item";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Customer, Employee, Booking } from "@truths/sales";
import { Venue, Show, Organizer } from "@truths/ticketing";

/**
 * Configuration for creating a searchable entity type in the command palette
 */
interface EntityTypeFactoryConfig<T extends BaseDataItem> {
  key: string;
  name: string;
  icon: LucideIcon;
  scope: string;
  fetcher: (query: string) => Promise<T[]>;
  navigateTo: string;
  renderItem?: (item: T, onSelect: () => void) => ReactNode;
  getSearchValue?: (item: T) => string;
  getDisplayName?: (item: T) => string;
  getSubtitle?: (item: T) => string | null;
  getBadge?: (item: T) => string | null;
}

/**
 * Generic factory function to create a command palette entity type configuration
 */
function createEntityType<T extends BaseDataItem>(
  config: EntityTypeFactoryConfig<T>
): DataTypeConfig<BaseDataItem> {
  const {
    key,
    name,
    icon: Icon,
    scope,
    fetcher,
    navigateTo,
    renderItem,
    getSearchValue,
    getDisplayName,
    getSubtitle,
    getBadge,
  } = config;

  // Default render item for simple cases
  const defaultRenderItem = (item: BaseDataItem, onSelect: () => void) => {
    const typedItem = item as T;
    const displayName = getDisplayName?.(typedItem) ?? item.name ?? "Unknown";
    const subtitle = getSubtitle?.(typedItem) ?? null;
    const badge = getBadge?.(typedItem) ?? null;
    const searchValue =
      getSearchValue?.(typedItem) ?? `${key}-${item.id}-${displayName}`;

    return (
      <DefaultAppCommandPaletteItem
        icon={Icon}
        displayName={displayName}
        subtitle={subtitle}
        badge={badge}
        searchValue={searchValue}
        itemKey={key}
        itemId={item.id}
        onSelect={onSelect}
      />
    );
  };

  // Default search value generator
  const defaultGetSearchValue = (item: BaseDataItem) => {
    const typedItem = item as T;
    const displayName = getDisplayName?.(typedItem) ?? item.name ?? "";
    const subtitle = getSubtitle?.(typedItem) ?? "";
    return `${key}-${item.id}-${displayName}-${subtitle}`.toLowerCase();
  };

  return {
    key,
    name,
    icon: Icon,
    scope,
    fetcher: fetcher as (query: string) => Promise<BaseDataItem[]>,
    renderItem: renderItem
      ? (item: BaseDataItem, onSelect: () => void) =>
          renderItem(item as T, onSelect)
      : defaultRenderItem,
    getSearchValue: getSearchValue
      ? (item: BaseDataItem) => getSearchValue(item as T)
      : defaultGetSearchValue,
    navigateTo,
  };
}

/**
 * Create user entity type configuration for command palette
 */
export const createUserEntityType = (
  fetcher: (query: string) => Promise<CommandPaletteUser[]>
): DataTypeConfig<BaseDataItem> => {
  return createEntityType<CommandPaletteUser>({
    key: "users",
    name: "Users",
    icon: User,
    scope: "users",
    fetcher,
    navigateTo: "/users/$id",
    getDisplayName: (user) => user.name ?? nameExtractors.user(user),
    getSubtitle: (user) => user.email || null,
    getBadge: (user) => user.role || null,
    getSearchValue: (user) => {
      const userName = user.name ?? nameExtractors.user(user);
      return `user-${userName}-${user.email || ""}`;
    },
  });
};

export const createCustomerEntityType = (
  fetcher: (query: string) => Promise<Customer[]>
): DataTypeConfig<BaseDataItem> => {
  return createEntityType<Customer>({
    key: "customers",
    name: "Customers",
    icon: Users,
    scope: "customers",
    fetcher,
    navigateTo: "/sales/customers/$id",

    getDisplayName: (customer) =>
      customer.name || customer.code || String(customer.id),
    getSubtitle: (customer) => customer.code || null,
    getSearchValue: (customer) => {
      const displayCode = customer.code || customer.id;
      const displayName = customer.name || displayCode;
      return `customer-${customer.id}-${displayCode}-${displayName}`;
    },
  });
};

export const createEmployeeEntityType = (
  fetcher: (query: string) => Promise<Employee[]>
): DataTypeConfig<BaseDataItem> => {
  return createEntityType<Employee>({
    key: "employees",
    name: "Employees",
    icon: UserRound,
    scope: "employees",
    fetcher,
    navigateTo: "/sales/employees/$id",
    getDisplayName: (emp) => emp.name || emp.code || String(emp.id),
    getSubtitle: (emp) => emp.job_title || emp.department || null,
    getBadge: (emp) => emp.employment_type || null,
    getSearchValue: (emp) =>
      `employee-${emp.name}-${emp.code || ""}-${emp.work_email || ""}`,
  });
};

export const createBookingEntityType = (
  fetcher: (query: string) => Promise<(Booking & { name: string })[]>
): DataTypeConfig<BaseDataItem> => {
  return createEntityType<Booking & { name: string }>({
    key: "bookings",
    name: "Bookings",
    icon: Ticket,
    scope: "bookings",
    fetcher,
    navigateTo: "/sales/bookings/$id",
    getDisplayName: (b) => b.booking_number || String(b.id),
    getSubtitle: (b) => b.status || null,
    getBadge: (b) => b.payment_status || null,
    getSearchValue: (b) =>
      `booking-${b.booking_number}-${b.id}-${b.status || ""}`,
  });
};

export const createVenueEntityType = (
  fetcher: (query: string) => Promise<Venue[]>
): DataTypeConfig<BaseDataItem> => {
  return createEntityType<Venue>({
    key: "venues",
    name: "Venues",
    icon: Building2,
    scope: "venues",
    fetcher,
    navigateTo: "/ticketing/venues/$id",
    getDisplayName: (v) => v.name || v.code || String(v.id),
    getSubtitle: (v) => v.city || v.venue_type || null,
    getBadge: (v) => (v.capacity ? `${v.capacity} seats` : null),
    getSearchValue: (v) =>
      `venue-${v.name}-${v.code || ""}-${v.city || ""}-${v.venue_type || ""}`,
  });
};

export const createShowEntityType = (
  fetcher: (query: string) => Promise<Show[]>
): DataTypeConfig<BaseDataItem> => {
  return createEntityType<Show>({
    key: "shows",
    name: "Shows",
    icon: Film,
    scope: "shows",
    fetcher,
    navigateTo: "/ticketing/shows/$id",
    getDisplayName: (s) => s.name || s.code || String(s.id),
    getSubtitle: (s) => s.organizer?.name || s.started_date || null,
    getBadge: (s) => s.started_date || null,
    getSearchValue: (s) =>
      `show-${s.name}-${s.code || ""}-${s.organizer?.name || ""}`,
  });
};

export const createOrganizerEntityType = (
  fetcher: (query: string) => Promise<Organizer[]>
): DataTypeConfig<BaseDataItem> => {
  return createEntityType<Organizer>({
    key: "organizers",
    name: "Organizers",
    icon: Store,
    scope: "organizers",
    fetcher,
    navigateTo: "/ticketing/organizers/$id",
    getDisplayName: (o) => o.name || o.code || String(o.id),
    getSubtitle: (o) => o.email || o.city || null,
    getSearchValue: (o) =>
      `organizer-${o.name}-${o.code || ""}-${o.email || ""}`,
  });
};
