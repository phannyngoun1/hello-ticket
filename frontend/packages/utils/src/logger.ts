/**
 * Development-friendly logger utility
 * 
 * In development: Uses console methods directly
 * In production: Can be integrated with error tracking services
 * 
 * Usage:
 *   import { logger } from '@truths/utils'
 *   logger.info('User logged in', { userId: 123 })
 *   logger.error('Failed to fetch', error)
 */

const isDevelopment = (import.meta as any).env?.DEV

export const logger = {
    /**
     * Log informational messages (development only)
     */
    info: (..._args: unknown[]) => {
        if (isDevelopment) {
        }
    },

    /**
     * Log warnings (always logged)
     */
    warn: (...args: unknown[]) => {
        console.warn(...args)
    },

    /**
     * Log errors (always logged)
     * In production, this should be sent to error tracking service
     */
    error: (...args: unknown[]) => {
        console.error(...args)
        // TODO: Send to error tracking service in production (Sentry, Rollbar, etc.)
    },

    /**
     * Log debug messages (development only)
     */
    debug: (...args: unknown[]) => {
        if (isDevelopment) {
            console.debug(...args)
        }
    },

    /**
     * Group related logs together (development only)
     */
    group: (label: string, fn: () => void) => {
        if (isDevelopment) {
            console.group(label)
            fn()
            console.groupEnd()
        } else {
            fn()
        }
    },
}

/**
 * Example usage:
 * 
 * logger.info('User action', { action: 'click', target: 'button' })
 * logger.error('API Error', error)
 * logger.group('Data fetch', () => {
 *   logger.debug('Request params', params)
 *   logger.debug('Response', response)
 * })
 */
