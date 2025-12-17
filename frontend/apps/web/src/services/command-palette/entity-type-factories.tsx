import { User, Boxes, Users } from "lucide-react";
import type { DataTypeConfig, BaseDataItem } from "@truths/custom-ui";
import type { Item } from "@truths/inventory";
import type { CommandPaletteUser } from "./types";
import { nameExtractors } from "./mappers";
import { DefaultAppCommandPaletteItem } from "../../components/app-command-palette/default-app-command-palette-item";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Customer } from "@truths/sales";

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

/**
 * Create inventory item entity type configuration for command palette
 */
export const createItemEntityType = (
  fetcher: (query: string) => Promise<Item[]>
): DataTypeConfig<BaseDataItem> => {
  return createEntityType<Item>({
    key: "items",
    name: "Inventory Items",
    icon: Boxes,
    scope: "items",
    fetcher,
    navigateTo: "/inventory/items/$id",
    getDisplayName: (item) => item.name || item.code || item.sku || "Item",
    getSubtitle: (item) => item.code || item.sku || null,
    getBadge: (item) => item.default_uom || null,
    getSearchValue: (item) => {
      const code = item.code || item.sku || "";
      return `item-${code}-${item.name || ""}`;
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
