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
export declare const logger: {
    /**
     * Log informational messages (development only)
     */
    info: (..._args: unknown[]) => void;
    /**
     * Log warnings (always logged)
     */
    warn: (...args: unknown[]) => void;
    /**
     * Log errors (always logged)
     * In production, this should be sent to error tracking service
     */
    error: (...args: unknown[]) => void;
    /**
     * Log debug messages (development only)
     */
    debug: (...args: unknown[]) => void;
    /**
     * Group related logs together (development only)
     */
    group: (label: string, fn: () => void) => void;
};
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
//# sourceMappingURL=logger.d.ts.map