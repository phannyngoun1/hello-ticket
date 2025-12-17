/**
 * Ticketing Component Registry
 * 
 * Central registry for all ticketing management components.
 * Each component is self-contained and can be composed with other components.
 */

export interface TicketingComponentMetadata {
    name: string;
    description: string;
    category: 'general';
    tags: string[];
    dependencies?: string[];
    version: string;
    author?: string;
    preview?: string;
}

export interface TicketingComponent<T = any> {
    Component: React.ComponentType<T>;
    metadata: TicketingComponentMetadata;
    examples?: {
        title: string;
        description: string;
        code: string;
    }[];
}

export interface TicketingComponentRegistry {
    [key: string]: TicketingComponent;
}

/**
 * Registry of all available ticketing components
 */
export const ticketingComponents: TicketingComponentRegistry = {};

/**
 * Register a new ticketing component
 */
export function registerTicketingComponent<T = any>(
    id: string,
    component: TicketingComponent<T>
): void {
    if (ticketingComponents[id]) {
        console.warn(`Ticketing component "${id}" is already registered. Overwriting...`);
    }
    ticketingComponents[id] = component;
}

/**
 * Get a ticketing component by ID
 */
export function getTicketingComponent(id: string): TicketingComponent | undefined {
    return ticketingComponents[id];
}

/**
 * Get all ticketing components
 */
export function getAllTicketingComponents(): TicketingComponentRegistry {
    return ticketingComponents;
}

/**
 * Get ticketing components by category
 */
export function getTicketingComponentsByCategory(
    category: TicketingComponentMetadata['category']
): TicketingComponentRegistry {
    return Object.entries(ticketingComponents).reduce((acc, [id, component]) => {
        if (component.metadata.category === category) {
            acc[id] = component;
        }
        return acc;
    }, {} as TicketingComponentRegistry);
}

/**
 * Search ticketing components by tag
 */
export function getTicketingComponentsByTag(tag: string): TicketingComponentRegistry {
    return Object.entries(ticketingComponents).reduce((acc, [id, component]) => {
        if (component.metadata.tags.includes(tag)) {
            acc[id] = component;
        }
        return acc;
    }, {} as TicketingComponentRegistry);
}

/**
 * Get ticketing component dependencies
 */
export function getTicketingComponentDependencies(id: string): string[] {
    const component = ticketingComponents[id];
    if (!component || !component.metadata.dependencies) {
        return [];
    }
    return component.metadata.dependencies;
}
