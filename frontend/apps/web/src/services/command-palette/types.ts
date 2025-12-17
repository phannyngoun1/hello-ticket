import type { BaseDataItem } from "@truths/custom-ui";
import type { User as UserType } from "@truths/account";

/**
 * Generic type for command palette items that extends BaseDataItem with any type T
 */
export type CommandPaletteItem<T> = BaseDataItem & T;

/**
 * Command palette user item
 */
export type CommandPaletteUser = CommandPaletteItem<UserType>;

