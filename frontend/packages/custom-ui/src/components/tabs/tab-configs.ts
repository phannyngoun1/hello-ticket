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

/**
 * Tab metadata for navigation tabs
 * Defines properties for each route/tab including whether it's a list or detail page
 */
export interface TabMetadata {
    /** The route path */
    path: string;
    /** Display title */
    title: string;
    /** Icon name from Lucide */
    iconName: string;
    /** Page type - determines sorting order in grouped tabs */
    pageType: 'list' | 'detail' | 'sub-detail';
    /** Module grouping for tab organization */
    module: string;
    /** Priority for sorting within the same page type (lower = higher priority) */
    priority?: number;
}

/**
 * Configuration for all application tabs
 * This replaces hardcoded logic in TabManager
 */
export interface TabConfiguration {
    /** Array of all tab metadata */
    tabs: TabMetadata[];
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
    _pageType: "venue" | "customer" | "organizer",
    _options: {
        includeMetadata?: boolean;
        customTabs?: CustomTabItem[];
    } = {}
): CustomTabItem[] {
    console.warn('getPageTabs is deprecated. Define tab configurations at the application level instead.');
    return [];
}

/**
 * Utility functions for working with tab configurations
 */

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

/**
 * Get tab metadata for a given path
 */
export function getTabMetadata(config: TabConfiguration, path: string): TabMetadata | null {
    // First try exact match
    let metadata = config.tabs.find(tab => tab.path === path || tab.path === path + '/');
    if (metadata) return metadata;

    // Try pattern matching for dynamic routes
    // e.g., "/users/123" should match "/users/$id" pattern
    metadata = config.tabs.find(tab => {
        if (!tab.path.includes('$')) return false;

        // Convert pattern to regex
        const pattern = tab.path.replace(/\$[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(path);
    });

    return metadata || null;
}

/**
 * Check if a path is a list page based on configuration
 */
export function isListPageFromConfig(config: TabConfiguration, path: string): boolean {
    const metadata = getTabMetadata(config, path);
    return metadata?.pageType === 'list' || false;
}

/**
 * Check if a path is a detail page based on configuration
 */
export function isDetailPageFromConfig(config: TabConfiguration, path: string): boolean {
    const metadata = getTabMetadata(config, path);
    return metadata?.pageType === 'detail' || metadata?.pageType === 'sub-detail' || false;
}

/**
 * Get title and icon from configuration
 */
export function getTitleAndIconFromConfig(config: TabConfiguration, path: string): { title: string; iconName: string } {
    const metadata = getTabMetadata(config, path);

    if (metadata) {
        return { title: metadata.title, iconName: metadata.iconName };
    }

    // Fallback for unknown routes
    const segment = path.split("/").pop() || "Page";
    const safe = segment.match(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
        ? segment.charAt(0).toUpperCase() + segment.slice(1)
        : "Page";
    return { title: safe, iconName: "FileText" };
}

/**
 * Get module info from configuration
 */
export function getModuleFromConfig(config: TabConfiguration, path: string): string {
    const metadata = getTabMetadata(config, path);
    return metadata?.module || "Other";
}