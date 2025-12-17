/**
 * Filter Strategy Utilities
 * 
 * Determines when to use GET (query string) vs POST (body) for filter requests
 * based on filter complexity and size.
 */

/**
 * Estimate the size of a filter object when serialized to query string
 */
function estimateQueryStringSize(filter: Record<string, unknown>): number {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filter)) {
        if (value === undefined || value === null) continue;

        if (Array.isArray(value)) {
            // Arrays can grow very large
            const serialized = JSON.stringify(value);
            params.append(key, serialized);
        } else if (typeof value === 'object') {
            // Objects need to be stringified
            params.append(key, JSON.stringify(value));
        } else {
            params.append(key, String(value));
        }
    }

    return params.toString().length;
}

/**
 * Check if filter contains complex data types that should use POST
 */
function hasComplexTypes(filter: Record<string, unknown>): boolean {
    return Object.values(filter).some(value => {
        if (Array.isArray(value)) {
            // Arrays with more than a few items should use POST
            return value.length > 5;
        }
        if (typeof value === 'object' && value !== null) {
            // Nested objects should use POST
            return true;
        }
        return false;
    });
}

/**
 * Check if filter contains sensitive data that shouldn't be in URL
 */
function hasSensitiveData(filter: Record<string, unknown>): boolean {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    return Object.keys(filter).some(key =>
        sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
    );
}

/**
 * Configuration for filter strategy
 */
export interface FilterStrategyConfig {
    /**
     * Maximum query string size in characters (default: 1500)
     * Conservative limit to stay well under browser/server limits (~2000)
     */
    maxQueryStringSize?: number;

    /**
     * Whether arrays should always use POST (default: false)
     * If false, small arrays (< 5 items) can use GET
     */
    alwaysPostForArrays?: boolean;

    /**
     * Keys that indicate sensitive data requiring POST
     */
    sensitiveKeys?: string[];
}

/**
 * Determines whether to use POST (body) or GET (query string) for filter requests
 * 
 * @param filter - The filter object to evaluate
 * @param config - Configuration options
 * @returns true if POST should be used, false for GET
 */
export function shouldUsePostForFilter(
    filter: Record<string, unknown>,
    config: FilterStrategyConfig = {}
): boolean {
    const {
        maxQueryStringSize = 1500,
        alwaysPostForArrays = false,
        sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'],
    } = config;

    // Empty filter or very simple filter can use GET
    if (Object.keys(filter).length === 0) {
        return false;
    }

    // Check for sensitive data
    const hasSensitive = Object.keys(filter).some(key =>
        sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
    );
    if (hasSensitive) {
        return true;
    }

    // Check for complex types
    if (hasComplexTypes(filter)) {
        if (alwaysPostForArrays) {
            return true;
        }
        // For small arrays, check total size
        const size = estimateQueryStringSize(filter);
        return size > maxQueryStringSize;
    }

    // Check total estimated size
    const size = estimateQueryStringSize(filter);
    return size > maxQueryStringSize;
}

/**
 * Split filter into simple (GET-safe) and complex (POST-required) parts
 * 
 * @param filter - The full filter object
 * @param config - Configuration options
 * @returns Object with simple and complex filters
 */
export function splitFilter(
    filter: Record<string, unknown>,
    config: FilterStrategyConfig = {}
): {
    simple: Record<string, unknown>;
    complex: Record<string, unknown>;
} {
    const result: {
        simple: Record<string, unknown>;
        complex: Record<string, unknown>;
    } = {
        simple: {},
        complex: {},
    };

    for (const [key, value] of Object.entries(filter)) {
        if (value === undefined || value === null) continue;

        const isComplex =
            Array.isArray(value) && value.length > 5 ||
            (typeof value === 'object' && value !== null && !(value instanceof Date));

        if (isComplex) {
            result.complex[key] = value;
        } else {
            result.simple[key] = value;
        }
    }

    return result;
}

/**
 * Format filter for query string (handles simple types only)
 */
export function formatFilterForQueryString(
    filter: Record<string, unknown>
): URLSearchParams {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filter)) {
        if (value === undefined || value === null) continue;

        if (value instanceof Date) {
            params.append(key, value.toISOString());
        } else if (Array.isArray(value) && value.length <= 5) {
            // Small arrays: multiple params or comma-separated
            value.forEach(item => params.append(key, String(item)));
        } else {
            params.append(key, String(value));
        }
    }

    return params;
}

