/**
 * Purchasing Component Registry
 * 
 * Central registry for all purchasing management components.
 * Each component is self-contained and can be composed with other components.
 */

export interface PurchasingComponentMetadata {
    name: string;
    description: string;
    category: 'general';
    tags: string[];
    dependencies?: string[];
    version: string;
    author?: string;
    preview?: string;
}

export interface PurchasingComponent<T = any> {
    Component: React.ComponentType<T>;
    metadata: PurchasingComponentMetadata;
    examples?: {
        title: string;
        description: string;
        code: string;
    }[];
}

export interface PurchasingComponentRegistry {
    [key: string]: PurchasingComponent;
}

/**
 * Registry of all available purchasing components
 */
export const purchasingComponents: PurchasingComponentRegistry = {};

/**
 * Register a new purchasing component
 */
export function registerPurchasingComponent<T = any>(
    id: string,
    component: PurchasingComponent<T>
): void {
    if (purchasingComponents[id]) {
        console.warn(`Purchasing component "${id}" is already registered. Overwriting...`);
    }
    purchasingComponents[id] = component;
}

/**
 * Get a purchasing component by ID
 */
export function getPurchasingComponent(id: string): PurchasingComponent | undefined {
    return purchasingComponents[id];
}

/**
 * Get all purchasing components
 */
export function getAllPurchasingComponents(): PurchasingComponentRegistry {
    return purchasingComponents;
}

/**
 * Get purchasing components by category
 */
export function getPurchasingComponentsByCategory(
    category: PurchasingComponentMetadata['category']
): PurchasingComponentRegistry {
    return Object.entries(purchasingComponents).reduce((acc, [id, component]) => {
        if (component.metadata.category === category) {
            acc[id] = component;
        }
        return acc;
    }, {} as PurchasingComponentRegistry);
}

/**
 * Search purchasing components by tag
 */
export function getPurchasingComponentsByTag(tag: string): PurchasingComponentRegistry {
    return Object.entries(purchasingComponents).reduce((acc, [id, component]) => {
        if (component.metadata.tags.includes(tag)) {
            acc[id] = component;
        }
        return acc;
    }, {} as PurchasingComponentRegistry);
}

/**
 * Get purchasing component dependencies
 */
export function getPurchasingComponentDependencies(id: string): string[] {
    const component = purchasingComponents[id];
    if (!component || !component.metadata.dependencies) {
        return [];
    }
    return component.metadata.dependencies;
}
