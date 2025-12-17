/**
 * Inventory Component Registry
 * 
 * Central registry for all inventory management components.
 * Each component is self-contained and can be composed with other components.
 */

export interface InventoryComponentMetadata {
    name: string;
    description: string;
    category: 'item';
    tags: string[];
    dependencies?: string[];
    version: string;
    author?: string;
    preview?: string;
}

export interface InventoryComponent<T = any> {
    Component: React.ComponentType<T>;
    metadata: InventoryComponentMetadata;
    examples?: {
        title: string;
        description: string;
        code: string;
    }[];
}

export interface InventoryComponentRegistry {
    [key: string]: InventoryComponent;
}

/**
 * Registry of all available inventory components
 */
export const inventoryComponents: InventoryComponentRegistry = {};

/**
 * Register a new inventory component
 */
export function registerInventoryComponent<T = any>(
    id: string,
    component: InventoryComponent<T>
): void {
    if (inventoryComponents[id]) {
        console.warn(`Inventory component "${id}" is already registered. Overwriting...`);
    }
    inventoryComponents[id] = component;
}

/**
 * Get a inventory component by ID
 */
export function getInventoryComponent(id: string): InventoryComponent | undefined {
    return inventoryComponents[id];
}

/**
 * Get all inventory components
 */
export function getAllInventoryComponents(): InventoryComponentRegistry {
    return inventoryComponents;
}

/**
 * Get inventory components by category
 */
export function getInventoryComponentsByCategory(
    category: InventoryComponentMetadata['category']
): InventoryComponentRegistry {
    return Object.entries(inventoryComponents).reduce((acc, [id, component]) => {
        if (component.metadata.category === category) {
            acc[id] = component;
        }
        return acc;
    }, {} as InventoryComponentRegistry);
}

/**
 * Search inventory components by tag
 */
export function getInventoryComponentsByTag(tag: string): InventoryComponentRegistry {
    return Object.entries(inventoryComponents).reduce((acc, [id, component]) => {
        if (component.metadata.tags.includes(tag)) {
            acc[id] = component;
        }
        return acc;
    }, {} as InventoryComponentRegistry);
}

/**
 * Get inventory component dependencies
 */
export function getInventoryComponentDependencies(id: string): string[] {
    const component = inventoryComponents[id];
    if (!component || !component.metadata.dependencies) {
        return [];
    }
    return component.metadata.dependencies;
}
