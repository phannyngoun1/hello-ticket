// Logger utility
export { logger } from './logger'

// Date utilities
export const formatDate = (date: Date | string, locale: string = 'en-US'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(dateObj)
}

export const formatDateTime = (date: Date | string, locale: string = 'en-US'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(dateObj)
}

// String utilities
export const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export const truncate = (str: string, length: number): string => {
    return str.length > length ? str.substring(0, length) + '...' : str
}

// Number utilities
export const formatCurrency = (
    amount: number,
    currency: string = 'USD',
    locale: string = 'en-US'
): string => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(amount)
}

// Validation utilities
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

// Check if localStorage is available (browser environment)
function isStorageAvailable(): boolean {
    try {
        return typeof window !== 'undefined' &&
            typeof window.localStorage !== 'undefined' &&
            window.localStorage !== null
    } catch {
        return false
    }
}

// Storage utilities
export const storage = {
    get: <T>(key: string, defaultValue?: T): T | null => {
        if (!isStorageAvailable()) {
            return defaultValue ?? null
        }
        try {
            const item = window.localStorage.getItem(key)
            // Handle null, undefined, or invalid JSON strings
            if (!item || item === 'undefined' || item === 'null') {
                return defaultValue ?? null
            }
            return JSON.parse(item)
        } catch (error) {
            console.error(`Error getting item ${key} from localStorage:`, error)
            // If parsing fails, remove the invalid item and return default
            try {
                window.localStorage.removeItem(key)
            } catch {
                // Ignore removal errors
            }
            return defaultValue ?? null
        }
    },
    set: <T>(key: string, value: T): void => {
        if (!isStorageAvailable()) {
            console.warn(`localStorage not available, cannot set ${key}`)
            return
        }
        try {
            window.localStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
            console.error(`Error setting item ${key} in localStorage:`, error)
        }
    },
    remove: (key: string): void => {
        if (!isStorageAvailable()) {
            console.warn(`localStorage not available, cannot remove ${key}`)
            return
        }
        try {
            window.localStorage.removeItem(key)
        } catch (error) {
            console.error(`Error removing item ${key} from localStorage:`, error)
        }
    },
    clear: (): void => {
        if (!isStorageAvailable()) {
            console.warn('localStorage not available, cannot clear')
            return
        }
        try {
            window.localStorage.clear()
        } catch (error) {
            console.error('Error clearing localStorage:', error)
        }
    },
    removeMatching: (pattern: string | RegExp): void => {
        if (!isStorageAvailable()) {
            console.warn('localStorage not available, cannot remove matching keys')
            return
        }
        try {
            const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
            const keysToRemove: string[] = [];

            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                if (key && regex.test(key)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => window.localStorage.removeItem(key));
        } catch (error) {
            console.error('Error removing matching keys from localStorage:', error)
        }
    },
}

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

// Delay utility
export const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// JWT utilities
export {
    decodeJWTPayload,
    getTokenExpiration,
    isTokenExpired,
    getTimeUntilExpiration,
    type JWTPayload,
} from './jwt'

// Cache management
export {
    cacheManager,
    CacheManager,
    type CacheType,
    type CacheEntry,
    type CacheInvalidationMessage,
    type CacheInvalidationHandler,
} from './cache-manager'

export {
    CACHE_KEYS,
    CACHE_PATTERNS,
    initializeCacheRegistry,
    invalidateUserCaches,
    invalidateAllCaches,
} from './cache-registry'

// User preferences management
export {
    userPreferences,
    UserPreferencesManager,
    type UserPreferences,
} from './user-preferences'

// UI Density hooks
export { useDensity } from './use-density'
export {
    useDensityStyles,
    useIsCompact,
    type DensityStyles,
} from './use-density-styles'

