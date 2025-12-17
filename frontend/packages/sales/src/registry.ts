/**
 * Sales Component Registry
 * 
 * Central registry for all sales management components.
 * Each component is self-contained and can be composed with other components.
 */

export interface SalesComponentMetadata {
    name: string;
    description: string;
    category: 'general';
    tags: string[];
    dependencies?: string[];
    version: string;
    author?: string;
    preview?: string;
}

export interface SalesComponent<T = any> {
    Component: React.ComponentType<T>;
    metadata: SalesComponentMetadata;
    examples?: {
        title: string;
        description: string;
        code: string;
    }[];
}

export interface SalesComponentRegistry {
    [key: string]: SalesComponent;
}

/**
 * Registry of all available sales components
 */
export const salesComponents: SalesComponentRegistry = {};

/**
 * Register a new sales component
 */
export function registerSalesComponent<T = any>(
    id: string,
    component: SalesComponent<T>
): void {
    if (salesComponents[id]) {
        console.warn(`Sales component "${id}" is already registered. Overwriting...`);
    }
    salesComponents[id] = component;
}

/**
 * Get a sales component by ID
 */
export function getSalesComponent(id: string): SalesComponent | undefined {
    return salesComponents[id];
}

/**
 * Get all sales components
 */
export function getAllSalesComponents(): SalesComponentRegistry {
    return salesComponents;
}

/**
 * Get sales components by category
 */
export function getSalesComponentsByCategory(
    category: SalesComponentMetadata['category']
): SalesComponentRegistry {
    return Object.entries(salesComponents).reduce((acc, [id, component]) => {
        if (component.metadata.category === category) {
            acc[id] = component;
        }
        return acc;
    }, {} as SalesComponentRegistry);
}

/**
 * Search sales components by tag
 */
export function getSalesComponentsByTag(tag: string): SalesComponentRegistry {
    return Object.entries(salesComponents).reduce((acc, [id, component]) => {
        if (component.metadata.tags.includes(tag)) {
            acc[id] = component;
        }
        return acc;
    }, {} as SalesComponentRegistry);
}

/**
 * Get sales component dependencies
 */
export function getSalesComponentDependencies(id: string): string[] {
    const component = salesComponents[id];
    if (!component || !component.metadata.dependencies) {
        return [];
    }
    return component.metadata.dependencies;
}
