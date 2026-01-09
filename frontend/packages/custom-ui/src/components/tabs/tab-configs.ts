/**
 * Tab Configuration Types
 *
 * Type definitions for tab configurations.
 * Business-specific configurations should be defined at the application level,
 * not in the reusable component library.
 */

import type { CustomTabItem } from "./index";

export interface TabGroup {
    name: string;
    description: string;
    tabs: CustomTabItem[];
}

export interface DetailPageTabs {
    operational?: TabGroup;
    informational?: TabGroup;
    contact?: TabGroup;
    technical?: TabGroup;
    management?: TabGroup;
}

// DEPRECATED: These hardcoded configurations have been moved to application-level files
// for better separation of concerns and reusability. See venue-tabs-config.ts, etc.

/**
 * Utility function to flatten tab groups into a single array
 * Use this when you have grouped tab configurations
 */
export function flattenTabGroups(
    tabGroups: DetailPageTabs,
    includeGroups: (keyof DetailPageTabs)[] = ["operational", "informational", "contact", "technical", "management"]
): CustomTabItem[] {
    const tabs: CustomTabItem[] = [];

    includeGroups.forEach(groupKey => {
        const group = tabGroups[groupKey];
        if (group) {
            tabs.push(...group.tabs);
        }
    });

    return tabs;
}

/**
 * DEPRECATED: getPageTabs has been removed.
 * Define tab configurations at the application level instead.
 * See venue-tabs-config.ts for an example of the new pattern.
 *
 * @deprecated Use application-level tab configurations instead
 */
export function getPageTabs(
    pageType: "venue" | "customer" | "organizer",
    options: {
        includeMetadata?: boolean;
        customTabs?: CustomTabItem[];
    } = {}
): CustomTabItem[] {
    console.warn('getPageTabs is deprecated. Define tab configurations at the application level instead.');
    return [];
}

/**
 * Group tabs by priority for responsive layouts
 * Useful for organizing tabs in different display contexts
 */
export function groupTabsByPriority(tabs: CustomTabItem[]): {
    primary: CustomTabItem[];
    secondary: CustomTabItem[];
    technical: CustomTabItem[];
} {
    const primary: CustomTabItem[] = [];
    const secondary: CustomTabItem[] = [];
    const technical: CustomTabItem[] = [];

    tabs.forEach(tab => {
        if (tab.value === "layout" || tab.value === "overview") {
            primary.push(tab);
        } else if (tab.value === "metadata") {
            technical.push(tab);
        } else {
            secondary.push(tab);
        }
    });

    return { primary, secondary, technical };
}