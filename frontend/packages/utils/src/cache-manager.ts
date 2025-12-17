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
import { storage } from './index';

export type CacheType = 'localStorage' | 'memory' | 'react-query';

export interface CacheEntry<T = unknown> {
    key: string;
    type: CacheType;
    value?: T;
    timestamp?: number;
    ttl?: number; // Time to live in milliseconds
    invalidateOn?: string[]; // List of invalidation patterns
}

export interface CacheInvalidationMessage {
    type: 'invalidate';
    cacheKey?: string; // Specific key to invalidate
    cachePattern?: string; // Pattern to match multiple keys (e.g., 'users:*', 'session:*')
    cacheType?: CacheType; // Specific cache type, or all if not specified
    scope?: 'user' | 'tenant' | 'global'; // Scope of invalidation
    metadata?: Record<string, unknown>;
}

export type CacheInvalidationHandler = (message: CacheInvalidationMessage) => void | Promise<void>;

/**
 * Centralized Cache Manager
 */
class CacheManager {
    private memoryCache: Map<string, CacheEntry> = new Map();
    private handlers: Map<string, CacheInvalidationHandler[]> = new Map();
    public queryClient: QueryClient | null = null; // Made public for access in registry
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000; // Start with 1 second

    /**
     * Register React Query client for cache invalidation
     */
    setQueryClient(queryClient: QueryClient): void {
        this.queryClient = queryClient;
    }

    /**
     * Register a cache entry
     */
    register<T>(entry: CacheEntry<T>): void {
        switch (entry.type) {
            case 'localStorage':
                // localStorage is handled by storage utility
                break;
            case 'memory':
                this.memoryCache.set(entry.key, entry as CacheEntry);
                break;
            case 'react-query':
                // React Query manages its own cache
                break;
        }
    }

    /**
     * Get value from cache
     */
    get<T>(key: string, type: CacheType = 'localStorage'): T | null {
        switch (type) {
            case 'localStorage': {
                const entry = storage.get<CacheEntry<T>>(`cache:${key}`);
                if (!entry) return null;

                // Check TTL
                if (entry.timestamp && entry.ttl) {
                    const age = Date.now() - entry.timestamp;
                    if (age > entry.ttl) {
                        this.remove(key, type);
                        return null;
                    }
                }

                return entry.value ?? null;
            }
            case 'memory': {
                const entry = this.memoryCache.get(key);
                if (!entry) return null;

                // Check TTL
                if (entry.timestamp && entry.ttl) {
                    const age = Date.now() - entry.timestamp;
                    if (age > entry.ttl) {
                        this.remove(key, type);
                        return null;
                    }
                }

                return entry.value as T | null;
            }
            case 'react-query': {
                if (!this.queryClient) return null;
                const data = this.queryClient.getQueryData<T>(key.split(':'));
                return data ?? null;
            }
        }
    }

    /**
     * Set value in cache
     */
    set<T>(key: string, value: T, type: CacheType = 'localStorage', ttl?: number): void {
        const timestamp = Date.now();
        const entry: CacheEntry<T> = {
            key,
            type,
            value,
            timestamp,
            ttl,
        };

        switch (type) {
            case 'localStorage':
                storage.set(`cache:${key}`, entry);
                break;
            case 'memory':
                this.memoryCache.set(key, entry);
                break;
            case 'react-query':
                if (this.queryClient) {
                    // React Query keys are arrays
                    const queryKey = key.includes(':') ? key.split(':') : [key];
                    this.queryClient.setQueryData(queryKey, value);
                }
                break;
        }
    }

    /**
     * Remove value from cache
     */
    remove(key: string, type?: CacheType): void {
        if (type) {
            this.removeByType(key, type);
        } else {
            // Remove from all cache types
            this.removeByType(key, 'localStorage');
            this.removeByType(key, 'memory');
            this.removeByType(key, 'react-query');
        }
    }

    private removeByType(key: string, type: CacheType): void {
        switch (type) {
            case 'localStorage':
                storage.remove(`cache:${key}`);
                break;
            case 'memory':
                this.memoryCache.delete(key);
                break;
            case 'react-query':
                if (this.queryClient) {
                    const queryKey = key.includes(':') ? key.split(':') : [key];
                    this.queryClient.removeQueries({ queryKey });
                }
                break;
        }
    }

    /**
     * Clear cache by pattern
     */
    clear(pattern?: string | RegExp, type?: CacheType): void {
        if (pattern) {
            this.clearByPattern(pattern, type);
        } else {
            // Clear all caches
            this.clearAll();
        }
    }

    private clearByPattern(pattern: string | RegExp, type?: CacheType): void {
        const regex = typeof pattern === 'string'
            ? new RegExp(pattern.replace('*', '.*'))
            : pattern;

        const typesToClear: CacheType[] = type
            ? [type]
            : ['localStorage', 'memory', 'react-query'];

        typesToClear.forEach(cacheType => {
            switch (cacheType) {
                case 'localStorage': {
                    // Get all cache keys
                    const keysToRemove: string[] = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key?.startsWith('cache:') && regex.test(key)) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach(key => {
                        const cacheKey = key.replace('cache:', '');
                        this.remove(cacheKey, 'localStorage');
                    });
                    break;
                }
                case 'memory': {
                    const keysToRemove: string[] = [];
                    this.memoryCache.forEach((_, key) => {
                        if (regex.test(key)) {
                            keysToRemove.push(key);
                        }
                    });
                    keysToRemove.forEach(key => this.remove(key, 'memory'));
                    break;
                }
                case 'react-query': {
                    if (this.queryClient) {
                        // React Query uses array keys, so we need to handle this differently
                        // Use the queryClient's built-in pattern matching
                        this.queryClient.removeQueries({
                            predicate: (query) => {
                                const keyStr = Array.isArray(query.queryKey)
                                    ? query.queryKey.join(':')
                                    : String(query.queryKey);
                                return regex.test(keyStr);
                            }
                        });
                    }
                    break;
                }
            }
        });
    }

    private clearAll(): void {
        // Clear localStorage caches
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('cache:')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Clear memory cache
        this.memoryCache.clear();

        // Clear React Query cache
        if (this.queryClient) {
            this.queryClient.clear();
        }
    }

    /**
     * Register handler for cache invalidation messages
     */
    onInvalidate(pattern: string, handler: CacheInvalidationHandler): () => void {
        if (!this.handlers.has(pattern)) {
            this.handlers.set(pattern, []);
        }
        this.handlers.get(pattern)!.push(handler);

        // Return unsubscribe function
        return () => {
            const handlers = this.handlers.get(pattern);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
                if (handlers.length === 0) {
                    this.handlers.delete(pattern);
                }
            }
        };
    }

    /**
     * Handle cache invalidation message from server
     */
    async handleInvalidation(message: CacheInvalidationMessage): Promise<void> {
        // Direct key invalidation
        if (message.cacheKey) {
            this.remove(message.cacheKey, message.cacheType);

            // Trigger handlers for this specific key
            const handlers = this.handlers.get(message.cacheKey) || [];
            for (const handler of handlers) {
                await handler(message);
            }
        }

        // Pattern-based invalidation
        if (message.cachePattern) {
            this.clear(message.cachePattern, message.cacheType);

            // Trigger handlers matching the pattern
            const regex = new RegExp(message.cachePattern.replace('*', '.*'));
            for (const [pattern, handlers] of this.handlers.entries()) {
                if (regex.test(pattern) || regex.test(message.cachePattern)) {
                    for (const handler of handlers) {
                        await handler(message);
                    }
                }
            }
        }

        // If no specific key or pattern, invalidate all (global scope)
        if (!message.cacheKey && !message.cachePattern) {
            if (message.scope === 'global') {
                this.clearAll();
            }
        }
    }

    /**
     * Start listening for broadcast messages (WebSocket or SSE)
     * Fails gracefully if endpoint doesn't exist
     */
    connect(url?: string): void {
        if (this.isConnected) return;

        // Check if broadcast is enabled (opt-in by default, set to 'true' to enable)
        const enableBroadcast = (import.meta as any).env?.VITE_ENABLE_CACHE_BROADCAST === 'true';
        if (!enableBroadcast) {
            // Silently skip if not enabled - this is expected behavior
            return;
        }

        // Try WebSocket first, fallback to SSE
        // Use setTimeout to prevent connection errors from appearing in console during initial render
        setTimeout(() => {
            this.connectWebSocket(url);
        }, 0);
    }

    private connectWebSocket(url?: string): void {
        const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';
        const wsUrl = url || `${apiBaseUrl}/ws/cache-invalidate`.replace('http://', 'ws://').replace('https://', 'wss://');

        try {
            // Suppress browser console errors by wrapping in try-catch
            // The browser will still log to console, but we'll handle it gracefully
            const ws = new WebSocket(wsUrl);

            // Set up a flag to track if we should suppress errors
            let shouldSuppressErrors = true; // Suppress initial connection errors

            // Use a small timeout to detect if connection fails immediately
            const connectionTimeout = setTimeout(() => {
                if (!this.isConnected) {
                    shouldSuppressErrors = false; // After timeout, allow some logging
                }
            }, 1000);

            ws.onopen = () => {
                clearTimeout(connectionTimeout);
                shouldSuppressErrors = false;
                this.isConnected = true;
                this.reconnectAttempts = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const message: CacheInvalidationMessage = JSON.parse(event.data);
                    this.handleInvalidation(message);
                } catch (error) {
                    console.error('[CacheManager] Failed to parse WebSocket message:', error);
                }
            };

            ws.onerror = () => {
                // Suppress error logging - browser will log it anyway, but we handle it silently
                this.isConnected = false;
                clearTimeout(connectionTimeout);

                // Only attempt SSE if this was the initial connection attempt
                if (this.reconnectAttempts === 0 && shouldSuppressErrors) {
                    // Silently try SSE
                    setTimeout(() => this.connectSSE(url), 100);
                }
            };

            ws.onclose = (event) => {
                clearTimeout(connectionTimeout);
                this.isConnected = false;

                // Only attempt reconnect if connection was established before
                // Initial connection failures (code 1006) mean endpoint doesn't exist
                if (event.code === 1006 && this.reconnectAttempts === 0 && shouldSuppressErrors) {
                    // Initial connection failed silently - endpoint doesn't exist
                    // Don't log, don't retry - just stop
                    return;
                }

                // Only reconnect if we had a successful connection before
                if (this.reconnectAttempts > 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.attemptReconnect();
                }
            };
        } catch (error) {
            // WebSocket creation failed - silently try SSE
            this.connectSSE(url);
        }
    }

    private connectSSE(url?: string): void {
        const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';
        const sseUrl = url || `${apiBaseUrl}/api/v1/cache/invalidate/stream`;

        try {
            const eventSource = new EventSource(sseUrl);
            let hasConnected = false;

            // Set timeout to detect immediate failure
            const connectionTimeout = setTimeout(() => {
                if (!hasConnected) {
                    // Connection failed immediately - endpoint doesn't exist
                    eventSource.close();
                    this.isConnected = false;
                }
            }, 2000);

            eventSource.onopen = () => {
                clearTimeout(connectionTimeout);
                hasConnected = true;
                this.isConnected = true;
                this.reconnectAttempts = 0;
            };

            eventSource.onmessage = (event) => {
                try {
                    const message: CacheInvalidationMessage = JSON.parse(event.data);
                    this.handleInvalidation(message);
                } catch (error) {
                    console.error('[CacheManager] Failed to parse SSE message:', error);
                }
            };

            eventSource.onerror = () => {
                clearTimeout(connectionTimeout);
                this.isConnected = false;

                // If we never connected, endpoint doesn't exist - fail silently
                if (!hasConnected && this.reconnectAttempts === 0) {
                    eventSource.close();
                    // Silently fail - endpoints don't exist
                    return;
                }

                // If we had a connection before, try to reconnect
                if (hasConnected && this.reconnectAttempts < this.maxReconnectAttempts) {
                    eventSource.close();
                    this.attemptReconnect();
                } else {
                    eventSource.close();
                }
            };
        } catch (error) {
            // SSE creation failed - endpoints don't exist, fail silently
            this.isConnected = false;
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            // Max attempts reached - stop trying silently
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

        setTimeout(() => {
            // Only reconnect if we previously had a connection
            // If initial connection failed, don't keep retrying
            if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                this.connect();
            }
        }, delay);
    }

    /**
     * Disconnect from broadcast service
     */
    disconnect(): void {
        this.isConnected = false;
        // WebSocket and SSE cleanup handled by browser
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        memoryCacheSize: number;
        localStorageCacheSize: number;
        isConnected: boolean;
    } {
        let localStorageCacheSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('cache:')) {
                localStorageCacheSize++;
            }
        }

        return {
            memoryCacheSize: this.memoryCache.size,
            localStorageCacheSize,
            isConnected: this.isConnected,
        };
    }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Export types and utilities
export { CacheManager };

