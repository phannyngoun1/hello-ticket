import type { User as UserType } from "@truths/account";
import type { Item } from "@truths/inventory";
import type {
    CommandPaletteItem,
    CommandPaletteUser,
} from "./types";
import { getUserDisplayName } from "@truths/account";

/**
 * Function type for extracting a display name from an entity
 */
type NameExtractor<T> = (entity: T) => string;

/**
 * Mapper configuration for a specific entity type
 */
interface MapperConfig<T> {
    extractName: NameExtractor<T>;
    fallbackName?: string;
}

/**
 * Registry of mappers for different entity types.
 * To add a new type, simply add a new entry here with:
 * - extractName: function to get the display name
 * - fallbackName: fallback if extractName returns empty
 */
const mapperRegistry = {
    user: {
        extractName: (user: UserType): string => {
            return getUserDisplayName(user);
        },
        fallbackName: "Unknown User",
    } satisfies MapperConfig<UserType>,

    item: {
        extractName: (item: Item): string => {
            return item.name || item.code || item.sku || "Item";
        },
        fallbackName: "Item",
    } satisfies MapperConfig<Item>,

} as const;

/**
 * Generic mapper function that converts any entity to a CommandPaletteItem
 * @param entity - The entity to map
 * @param type - The type of entity (key from mapperRegistry)
 * @returns A CommandPaletteItem with the entity data and a name property
 */
function mapToCommandPaletteItem<T extends keyof typeof mapperRegistry>(
    entity: Parameters<typeof mapperRegistry[T]["extractName"]>[0],
    type: T
): CommandPaletteItem<Parameters<typeof mapperRegistry[T]["extractName"]>[0]> {
    const config = mapperRegistry[type];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const name = config.extractName(entity as any) || config.fallbackName || "Unknown";

    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(entity as any),
        name,
    } as CommandPaletteItem<Parameters<typeof mapperRegistry[T]["extractName"]>[0]>;
}

/**
 * Map a user to a CommandPaletteUser
 */
export const mapUserToCommandPaletteItem = (
    user: UserType
): CommandPaletteUser => {
    return mapToCommandPaletteItem(user, "user") as CommandPaletteUser;
};

/**
 * Map an item to a CommandPaletteItem
 */
export const mapItemToDataItem = (
    item: Item
): CommandPaletteItem<Item> => {
    return mapToCommandPaletteItem(item, "item");
};

/**
 * Export the name extractors for use in other contexts (e.g., display logic)
 */
export const nameExtractors = {
    user: mapperRegistry.user.extractName,
    item: mapperRegistry.item.extractName,
} as const;

