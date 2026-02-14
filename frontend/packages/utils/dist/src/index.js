// Logger utility
export { logger } from './logger';
// Date utilities
export const formatDate = (date, locale = 'en-US') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(dateObj);
};
export const formatDateTime = (date, locale = 'en-US') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(dateObj);
};
// String utilities
export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
export const truncate = (str, length) => {
    return str.length > length ? str.substring(0, length) + '...' : str;
};
// Number utilities
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(amount);
};
// Validation utilities
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
// Check if localStorage is available (browser environment)
function isStorageAvailable() {
    try {
        return typeof window !== 'undefined' &&
            typeof window.localStorage !== 'undefined' &&
            window.localStorage !== null;
    }
    catch {
        return false;
    }
}
// Storage utilities
export const storage = {
    get: (key, defaultValue) => {
        if (!isStorageAvailable()) {
            return defaultValue ?? null;
        }
        try {
            const item = window.localStorage.getItem(key);
            // Handle null, undefined, or invalid JSON strings
            if (!item || item === 'undefined' || item === 'null') {
                return defaultValue ?? null;
            }
            return JSON.parse(item);
        }
        catch (error) {
            console.error(`Error getting item ${key} from localStorage:`, error);
            // If parsing fails, remove the invalid item and return default
            try {
                window.localStorage.removeItem(key);
            }
            catch {
                // Ignore removal errors
            }
            return defaultValue ?? null;
        }
    },
    set: (key, value) => {
        if (!isStorageAvailable()) {
            console.warn(`localStorage not available, cannot set ${key}`);
            return;
        }
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        }
        catch (error) {
            console.error(`Error setting item ${key} in localStorage:`, error);
        }
    },
    remove: (key) => {
        if (!isStorageAvailable()) {
            console.warn(`localStorage not available, cannot remove ${key}`);
            return;
        }
        try {
            window.localStorage.removeItem(key);
        }
        catch (error) {
            console.error(`Error removing item ${key} from localStorage:`, error);
        }
    },
    clear: () => {
        if (!isStorageAvailable()) {
            console.warn('localStorage not available, cannot clear');
            return;
        }
        try {
            window.localStorage.clear();
        }
        catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    },
    removeMatching: (pattern) => {
        if (!isStorageAvailable()) {
            console.warn('localStorage not available, cannot remove matching keys');
            return;
        }
        try {
            const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
            const keysToRemove = [];
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                if (key && regex.test(key)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => window.localStorage.removeItem(key));
        }
        catch (error) {
            console.error('Error removing matching keys from localStorage:', error);
        }
    },
};
// Debounce utility
export const debounce = (func, wait) => {
    let timeout = null;
    return (...args) => {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
// Delay utility
export const delay = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
// JWT utilities
export { decodeJWTPayload, getTokenExpiration, isTokenExpired, getTimeUntilExpiration, } from './jwt';
// Cache management
export { cacheManager, CacheManager, } from './cache-manager';
export { CACHE_KEYS, CACHE_PATTERNS, initializeCacheRegistry, invalidateUserCaches, invalidateAllCaches, } from './cache-registry';
// User preferences management
export { userPreferences, UserPreferencesManager, } from './user-preferences';
// UI Density hooks
export { useDensity } from './use-density';
export { useDensityStyles, useIsCompact, } from './use-density-styles';
