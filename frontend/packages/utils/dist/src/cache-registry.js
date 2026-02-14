/**
 * Cache Registry
 *
 * Centralized registry for all cache keys used in the application.
 * Makes it easy to:
 * - Track all cached data
 * - Invalidate related caches
 * - Maintain consistency
 */
import { cacheManager } from './cache-manager';
/**
 * Predefined cache keys
 */
export const CACHE_KEYS = {
    // Session & Auth
    SESSION_CONFIG: 'session:config',
    AUTH_TOKEN: 'auth:token',
    REFRESH_TOKEN: 'auth:refresh_token',
    USER_PROFILE: 'user:profile',
    // User Data
    USERS_LIST: 'users:list',
    USER_DETAIL: 'user:detail', // Use with ID: user:detail:{id}
    USER_ACTIVITY: 'user:activity', // Use with ID: user:activity:{id}
    // React Query Persistence
    REACT_QUERY_CACHE: 'react-query:cache',
    // UI State
    APP_TABS: 'app:tabs',
    SCROLL_POSITIONS: 'app:scroll:positions',
    COMMAND_PALETTE_RECENT: 'ui:command-palette:recent',
    // Other
    THEME: 'app:theme',
    LOCALE: 'app:locale',
    USER_PREFERENCES: 'user:preferences',
};
/**
 * Cache patterns for bulk invalidation
 */
export const CACHE_PATTERNS = {
    ALL_SESSION: 'session:*',
    ALL_USERS: 'users:*',
    ALL_USER_DETAILS: 'user:detail:*',
    ALL_USER_ACTIVITY: 'user:activity:*',
    ALL_AUTH: 'auth:*',
    ALL_UI: 'ui:*',
    ALL_APP: 'app:*',
};
/**
 * Cache definitions registry
 */
const CACHE_DEFINITIONS = [
    {
        key: CACHE_KEYS.SESSION_CONFIG,
        type: 'localStorage',
        ttl: 60 * 60 * 1000, // 1 hour
        description: 'Session configuration from server',
        invalidateOn: [CACHE_PATTERNS.ALL_SESSION, 'auth:logout'],
    },
    {
        key: CACHE_KEYS.USERS_LIST,
        type: 'react-query',
        description: 'List of users',
        invalidateOn: ['users:create', 'users:update', 'users:delete'],
    },
    {
        key: CACHE_KEYS.USER_DETAIL,
        type: 'react-query',
        description: 'Individual user details',
        invalidateOn: ['user:update', 'user:delete'],
    },
    {
        key: CACHE_KEYS.USER_ACTIVITY,
        type: 'react-query',
        description: 'User activity logs',
        invalidateOn: ['user:update', 'user:activity:new'],
    },
    {
        key: CACHE_KEYS.REACT_QUERY_CACHE,
        type: 'localStorage',
        description: 'React Query persisted cache',
        invalidateOn: ['auth:logout', 'auth:login'],
    },
    {
        key: CACHE_KEYS.APP_TABS,
        type: 'localStorage',
        description: 'Open tabs state',
        invalidateOn: ['auth:logout'],
    },
    {
        key: CACHE_KEYS.SCROLL_POSITIONS,
        type: 'localStorage',
        description: 'Scroll positions',
        invalidateOn: ['auth:logout'],
    },
    {
        key: CACHE_KEYS.COMMAND_PALETTE_RECENT,
        type: 'localStorage',
        description: 'Command palette recent searches',
        invalidateOn: ['auth:logout'],
    },
    {
        key: CACHE_KEYS.USER_PREFERENCES,
        type: 'localStorage',
        ttl: 365 * 24 * 60 * 60 * 1000, // 1 year TTL for user preferences
        description: 'User preferences (UI settings, data display preferences, etc.)',
        // Note: User preferences should NOT be cleared on logout - they persist across sessions
    },
];
/**
 * Initialize cache registry
 * Call this once at app startup
 */
export function initializeCacheRegistry() {
    // Register all cache definitions
    CACHE_DEFINITIONS.forEach(def => {
        cacheManager.register({
            key: def.key,
            type: def.type,
            ttl: def.ttl,
            invalidateOn: def.invalidateOn,
        });
    });
    // Set up invalidation handlers
    setupInvalidationHandlers();
}
/**
 * Set up automatic invalidation handlers based on patterns
 */
function setupInvalidationHandlers() {
    // Handle auth logout - clear all user-specific caches
    cacheManager.onInvalidate('auth:logout', async (message) => {
        // Clear all user-specific caches
        cacheManager.clear(CACHE_PATTERNS.ALL_SESSION);
        cacheManager.clear(CACHE_PATTERNS.ALL_AUTH);
        cacheManager.clear(CACHE_PATTERNS.ALL_USERS);
        cacheManager.clear(CACHE_PATTERNS.ALL_USER_DETAILS);
        cacheManager.clear(CACHE_PATTERNS.ALL_USER_ACTIVITY);
        cacheManager.clear(CACHE_PATTERNS.ALL_UI);
        // Clear React Query cache if available
        if (message.cacheType === 'react-query' || !message.cacheType) {
            const { cacheManager: cm } = await import('./cache-manager');
            if (cm.queryClient) {
                cm.queryClient.clear();
            }
        }
    });
    // Handle user updates - invalidate related caches
    cacheManager.onInvalidate('user:update', async (message) => {
        const userId = message.metadata?.userId;
        if (userId) {
            cacheManager.remove(`${CACHE_KEYS.USER_DETAIL}:${userId}`);
            cacheManager.remove(`${CACHE_KEYS.USER_ACTIVITY}:${userId}`);
        }
        cacheManager.clear(CACHE_PATTERNS.ALL_USERS);
    });
    // Handle user creation - invalidate users list
    cacheManager.onInvalidate('users:create', async () => {
        cacheManager.clear(CACHE_PATTERNS.ALL_USERS);
    });
    // Handle user deletion - invalidate users list and user details
    cacheManager.onInvalidate('users:delete', async (message) => {
        const userId = message.metadata?.userId;
        if (userId) {
            cacheManager.remove(`${CACHE_KEYS.USER_DETAIL}:${userId}`);
            cacheManager.remove(`${CACHE_KEYS.USER_ACTIVITY}:${userId}`);
        }
        cacheManager.clear(CACHE_PATTERNS.ALL_USERS);
    });
}
/**
 * Helper to invalidate user-related caches
 */
export function invalidateUserCaches(userId) {
    cacheManager.clear(CACHE_PATTERNS.ALL_USERS);
    if (userId) {
        cacheManager.remove(`${CACHE_KEYS.USER_DETAIL}:${userId}`);
        cacheManager.remove(`${CACHE_KEYS.USER_ACTIVITY}:${userId}`);
    }
}
/**
 * Helper to invalidate all caches (e.g., on logout)
 */
export function invalidateAllCaches() {
    cacheManager.handleInvalidation({
        type: 'invalidate',
        scope: 'global',
    });
}
