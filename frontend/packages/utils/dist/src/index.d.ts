export { logger } from './logger';
export declare const formatDate: (date: Date | string, locale?: string) => string;
export declare const formatDateTime: (date: Date | string, locale?: string) => string;
export declare const capitalize: (str: string) => string;
export declare const truncate: (str: string, length: number) => string;
export declare const formatCurrency: (amount: number, currency?: string, locale?: string) => string;
export declare const isValidEmail: (email: string) => boolean;
export declare const storage: {
    get: <T>(key: string, defaultValue?: T) => T | null;
    set: <T>(key: string, value: T) => void;
    remove: (key: string) => void;
    clear: () => void;
    removeMatching: (pattern: string | RegExp) => void;
};
export declare const debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => ((...args: Parameters<T>) => void);
export declare const delay: (ms: number) => Promise<void>;
export { decodeJWTPayload, getTokenExpiration, isTokenExpired, getTimeUntilExpiration, type JWTPayload, } from './jwt';
export { cacheManager, CacheManager, type CacheType, type CacheEntry, type CacheInvalidationMessage, type CacheInvalidationHandler, } from './cache-manager';
export { CACHE_KEYS, CACHE_PATTERNS, initializeCacheRegistry, invalidateUserCaches, invalidateAllCaches, } from './cache-registry';
export { userPreferences, UserPreferencesManager, type UserPreferences, } from './user-preferences';
export { useDensity } from './use-density';
export { useDensityStyles, useIsCompact, type DensityStyles, } from './use-density-styles';
//# sourceMappingURL=index.d.ts.map