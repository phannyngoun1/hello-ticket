/**
 * Centralized Cache Management System
 *
 * Provides unified cache management across the application with:
 * - Multiple cache types (localStorage, in-memory, React Query)
 * - Server-side invalidation via broadcast messages
 * - Type-safe cache operations
 * - Automatic cache expiration
 * - Easy registration and maintenance
 */
import { QueryClient } from '@tanstack/react-query';
export type CacheType = 'localStorage' | 'memory' | 'react-query';
export interface CacheEntry<T = unknown> {
    key: string;
    type: CacheType;
    value?: T;
    timestamp?: number;
    ttl?: number;
    invalidateOn?: string[];
}
export interface CacheInvalidationMessage {
    type: 'invalidate';
    cacheKey?: string;
    cachePattern?: string;
    cacheType?: CacheType;
    scope?: 'user' | 'tenant' | 'global';
    metadata?: Record<string, unknown>;
}
export type CacheInvalidationHandler = (message: CacheInvalidationMessage) => void | Promise<void>;
/**
 * Centralized Cache Manager
 */
declare class CacheManager {
    private memoryCache;
    private handlers;
    queryClient: QueryClient | null;
    private isConnected;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    /**
     * Register React Query client for cache invalidation
     */
    setQueryClient(queryClient: QueryClient): void;
    /**
     * Register a cache entry
     */
    register<T>(entry: CacheEntry<T>): void;
    /**
     * Get value from cache
     */
    get<T>(key: string, type?: CacheType): T | null;
    /**
     * Set value in cache
     */
    set<T>(key: string, value: T, type?: CacheType, ttl?: number): void;
    /**
     * Remove value from cache
     */
    remove(key: string, type?: CacheType): void;
    private removeByType;
    /**
     * Clear cache by pattern
     */
    clear(pattern?: string | RegExp, type?: CacheType): void;
    private clearByPattern;
    private clearAll;
    /**
     * Register handler for cache invalidation messages
     */
    onInvalidate(pattern: string, handler: CacheInvalidationHandler): () => void;
    /**
     * Handle cache invalidation message from server
     */
    handleInvalidation(message: CacheInvalidationMessage): Promise<void>;
    /**
     * Start listening for broadcast messages (WebSocket or SSE)
     * Fails gracefully if endpoint doesn't exist
     */
    connect(url?: string): void;
    private connectWebSocket;
    private connectSSE;
    private attemptReconnect;
    /**
     * Disconnect from broadcast service
     */
    disconnect(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        memoryCacheSize: number;
        localStorageCacheSize: number;
        isConnected: boolean;
    };
}
export declare const cacheManager: CacheManager;
export { CacheManager };
//# sourceMappingURL=cache-manager.d.ts.map