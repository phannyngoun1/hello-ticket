/**
 * Account Component Registry
 * 
 * Central registry for all account management components.
 * Each component is self-contained and can be composed with other components.
 */

export interface AccountComponentMetadata {
    name: string;
    description: string;
    category: 'users' | 'roles' | 'groups' | 'profile' | 'permissions' | 'activity';
    tags: string[];
    dependencies?: string[];
    version: string;
    author?: string;
    preview?: string;
}

export interface AccountComponent<T = any> {
    Component: React.ComponentType<T>;
    metadata: AccountComponentMetadata;
    examples?: {
        title: string;
        description: string;
        code: string;
    }[];
}

export interface AccountComponentRegistry {
    [key: string]: AccountComponent;
}

/**
 * Registry of all available account components
 */
export const accountComponents: AccountComponentRegistry = {};

/**
 * Register a new account component
 */
export function registerAccountComponent<T = any>(
    id: string,
    component: AccountComponent<T>
): void {
    if (accountComponents[id]) {
        console.warn(`Account component "${id}" is already registered. Overwriting...`);
    }
    accountComponents[id] = component;
}

/**
 * Get an account component by ID
 */
export function getAccountComponent(id: string): AccountComponent | undefined {
    return accountComponents[id];
}

/**
 * Get all account components
 */
export function getAllAccountComponents(): AccountComponentRegistry {
    return accountComponents;
}

/**
 * Get account components by category
 */
export function getAccountComponentsByCategory(
    category: AccountComponentMetadata['category']
): AccountComponentRegistry {
    return Object.entries(accountComponents).reduce((acc, [id, component]) => {
        if (component.metadata.category === category) {
            acc[id] = component;
        }
        return acc;
    }, {} as AccountComponentRegistry);
}

/**
 * Search account components by tag
 */
export function getAccountComponentsByTag(tag: string): AccountComponentRegistry {
    return Object.entries(accountComponents).reduce((acc, [id, component]) => {
        if (component.metadata.tags.includes(tag)) {
            acc[id] = component;
        }
        return acc;
    }, {} as AccountComponentRegistry);
}

/**
 * Get account component dependencies
 */
export function getAccountComponentDependencies(id: string): string[] {
    const component = accountComponents[id];
    if (!component || !component.metadata.dependencies) {
        return [];
    }
    return component.metadata.dependencies;
}

