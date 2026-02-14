/**
 * Cache Registry
 *
 * Centralized registry for all cache keys used in the application.
 * Makes it easy to:
 * - Track all cached data
 * - Invalidate related caches
 * - Maintain consistency
 */
import { CacheType } from './cache-manager';
export interface CacheDefinition {
    key: string;
    type: CacheType;
    ttl?: number;
    description?: string;
    invalidateOn?: string[];
}
/**
 * Predefined cache keys
 */
export declare const CACHE_KEYS: {
    readonly SESSION_CONFIG: "session:config";
    readonly AUTH_TOKEN: "auth:token";
    readonly REFRESH_TOKEN: "auth:refresh_token";
    readonly USER_PROFILE: "user:profile";
    readonly USERS_LIST: "users:list";
    readonly USER_DETAIL: "user:detail";
    readonly USER_ACTIVITY: "user:activity";
    readonly REACT_QUERY_CACHE: "react-query:cache";
    readonly APP_TABS: "app:tabs";
    readonly SCROLL_POSITIONS: "app:scroll:positions";
    readonly COMMAND_PALETTE_RECENT: "ui:command-palette:recent";
    readonly THEME: "app:theme";
    readonly LOCALE: "app:locale";
    readonly USER_PREFERENCES: "user:preferences";
};
/**
 * Cache patterns for bulk invalidation
 */
export declare const CACHE_PATTERNS: {
    readonly ALL_SESSION: "session:*";
    readonly ALL_USERS: "users:*";
    readonly ALL_USER_DETAILS: "user:detail:*";
    readonly ALL_USER_ACTIVITY: "user:activity:*";
    readonly ALL_AUTH: "auth:*";
    readonly ALL_UI: "ui:*";
    readonly ALL_APP: "app:*";
};
/**
 * Initialize cache registry
 * Call this once at app startup
 */
export declare function initializeCacheRegistry(): void;
/**
 * Helper to invalidate user-related caches
 */
export declare function invalidateUserCaches(userId?: string): void;
/**
 * Helper to invalidate all caches (e.g., on logout)
 */
export declare function invalidateAllCaches(): void;
//# sourceMappingURL=cache-registry.d.ts.map