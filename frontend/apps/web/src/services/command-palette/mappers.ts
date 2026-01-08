import type { User as UserType } from "@truths/account";
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
    // We know that config.extractName expects the entity type corresponding to the type key
    // so we can safely cast the extractName function to accept the entity
    const extractor = config.extractName as (e: typeof entity) => string;
    const name = extractor(entity) || config.fallbackName || "Unknown";

    return {
        ...entity,
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
 * Export the name extractors for use in other contexts (e.g., display logic)
 */
export const nameExtractors = {
    user: mapperRegistry.user.extractName,
} as const;

