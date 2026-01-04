/**
 * Centralized User Preferences Manager - Offline-First Strategy
 * 
 * Offline-First Architecture:
 * - All data is stored in localStorage cache first (immediate access)
 * - Data changes are queued and pushed to server when online
 * - Data loading from server only happens:
 *   1. On user login
 *   2. When cache is empty/detected as cleared
 * - Works seamlessly offline, syncs when connection restored
 * 
 * Manages all user preferences across the application using the cache manager.
 * Provides type-safe, centralized access to user preferences.
 */

import { cacheManager } from './cache-manager';
import { CACHE_KEYS } from './cache-registry';
import {
    getUserPreferences as apiGetPreferences,
    updatePreferences as apiUpdatePreferences,
} from '@truths/api';

/**
 * User preference types
 */
export interface UserPreferences {
    // UI Preferences
    ui?: {
        dataListView?: Record<string, 'card' | 'list'>; // Component-specific view preferences
        storeLocationView?: 'tree' | 'table'; // Store location view preference
        theme?: 'light' | 'dark' | 'system';
        tabPosition?: 'separate' | 'inline';
        enableTabs?: boolean;
        [key: string]: unknown;
    };

    // Data Display Preferences
    dataDisplay?: {
        pageSize?: number;
        sortOrder?: Record<string, 'asc' | 'desc'>;
        columnVisibility?: Record<string, boolean[]>;
        [key: string]: unknown;
    };

    // Notification Preferences
    notifications?: {
        email?: boolean;
        push?: boolean;
        sms?: boolean;
        [key: string]: boolean | unknown;
    };

    // Cache Preferences
    cache?: {
        queryCacheEnabled?: boolean; // Backend query cache
        reactQueryCacheEnabled?: boolean; // Frontend React Query cache
        [key: string]: unknown;
    };

    // Application-specific preferences
    [category: string]: Record<string, unknown> | undefined;
}


/**
 * Centralized User Preferences Manager - Offline-First Implementation
 */
class UserPreferencesManager {
    private readonly CACHE_KEY = CACHE_KEYS.USER_PREFERENCES;
    private readonly CACHE_TTL = 365 * 24 * 60 * 60 * 1000; // 1 year TTL
    private readonly SYNC_METADATA_KEY = `${CACHE_KEYS.USER_PREFERENCES}:metadata`; // Track sync state

    // Performance optimization: Debouncing and batching
    private readonly SYNC_DEBOUNCE_MS = 2000; // Wait 2 seconds after last change before syncing
    private readonly MAX_BATCH_SIZE = 10; // Force sync if more than 10 pending changes
    private syncTimeout: NodeJS.Timeout | null = null;
    private pendingChanges = new Set<string>(); // Track which preferences have changed
    private isDirty = false; // Track if any unsaved changes exist

    // Offline-first state
    private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    private isInitialized = false; // Track if cache has been checked/initialized
    private syncInProgress = false;

    constructor() {
        if (typeof window !== 'undefined') {
            // Setup network status listeners
            window.addEventListener('online', this.handleOnline.bind(this));
            window.addEventListener('offline', this.handleOffline.bind(this));

            // Setup page unload handler to sync pending changes
            window.addEventListener('beforeunload', () => {
                if (this.isDirty && this.isOnline) {
                    this.syncNow(true);
                }
            });

            // Sync when page becomes hidden (user switches tabs/apps)
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && this.isDirty && this.isOnline) {
                    this.syncNow();
                }
            });
        }
    }

    /**
     * Handle online event - sync pending changes
     */
    private handleOnline(): void {
        this.isOnline = true;
        // Sync any pending changes when coming back online
        if (this.isDirty) {
            this.syncNow().catch(error => {
                console.warn('Failed to sync preferences after coming online:', error);
            });
        }
    }

    /**
     * Handle offline event
     */
    private handleOffline(): void {
        this.isOnline = false;
        // Cancel any pending sync attempts
        this.cancelPendingSync();
    }

    /**
     * Check if cache exists and is valid
     */
    private hasCache(): boolean {
        const cached = cacheManager.get<UserPreferences>(this.CACHE_KEY, 'localStorage');
        return cached !== null && Object.keys(cached || {}).length > 0;
    }

    /**
     * Initialize preferences - Offline-First Strategy
     * 
     * Loading strategy:
     * 1. If cache exists → use cache immediately (offline-first)
     * 2. If cache is empty → load from backend (only when needed)
     * 3. Merge server data with local cache if conflicts exist
     * 
     * Call this after user login or when cache is detected as cleared
     */
    async initialize(forceReload = false): Promise<void> {
        // If already initialized and not forcing reload, skip
        if (this.isInitialized && !forceReload) {
            return;
        }

        const hasCache = this.hasCache();

        // Offline-First: If cache exists and we're not forcing reload, use cache
        if (hasCache && !forceReload) {
            // Cache exists - use it immediately (offline-first)
            // Only sync to server if we have pending changes and we're online
            if (this.isOnline) {
                // Background sync to ensure server is up-to-date (non-blocking)
                this.syncToServerIfNeeded().catch(error => {
                    console.warn('Background sync failed, using cached preferences:', error);
                });
            }
            this.isInitialized = true;
            return;
        }

        // Cache is empty or force reload - load from backend
        if (this.isOnline) {
            try {
                const response = await apiGetPreferences();
                if (response?.preferences) {
                    const prefs = response.preferences as Record<string, unknown>;

                    // If we have local changes, merge them with server data
                    const localPrefs = this.getAll();
                    if (this.isDirty && Object.keys(localPrefs).length > 0) {
                        // Merge: local changes take precedence
                        const merged = this.deepMerge(prefs, localPrefs);
                        cacheManager.set(
                            this.CACHE_KEY,
                            merged as UserPreferences,
                            'localStorage',
                            this.CACHE_TTL
                        );
                        // Mark as dirty since we have local changes not on server
                        this.isDirty = true;
                        this.scheduleSync();
                    } else {
                        // No local changes, use server data
                        cacheManager.set(
                            this.CACHE_KEY,
                            prefs as UserPreferences,
                            'localStorage',
                            this.CACHE_TTL
                        );
                        this.isDirty = false;
                        this.pendingChanges.clear();
                    }

                    this.saveSyncMetadata();
                } else {
                    // Server returned empty preferences, use cache if available
                    if (!hasCache) {
                        cacheManager.set(this.CACHE_KEY, {} as UserPreferences, 'localStorage', this.CACHE_TTL);
                    }
                }
            } catch (error) {
                // Offline or server error - use cached preferences if available
                console.warn('Failed to load preferences from backend, using cached values:', error);
                if (!hasCache) {
                    // No cache either - initialize with empty object
                    cacheManager.set(this.CACHE_KEY, {} as UserPreferences, 'localStorage', this.CACHE_TTL);
                }
            }
        } else {
            // We're offline and no cache - initialize with empty object
            if (!hasCache) {
                cacheManager.set(this.CACHE_KEY, {} as UserPreferences, 'localStorage', this.CACHE_TTL);
            }
        }

        this.isInitialized = true;
    }

    /**
     * Sync to server if we have pending changes (background sync)
     */
    private async syncToServerIfNeeded(): Promise<void> {
        if (!this.isOnline || !this.isDirty || this.syncInProgress) {
            return;
        }

        try {
            await this.syncNow();
        } catch (error) {
            // Silently fail - user will retry on next sync
            console.warn('Background sync failed:', error);
        }
    }

    /**
     * Save sync metadata to track last sync state
     */
    private saveSyncMetadata(): void {
        const metadata = {
            lastSync: Date.now(),
            isDirty: this.isDirty,
        };
        cacheManager.set(this.SYNC_METADATA_KEY, metadata, 'localStorage', this.CACHE_TTL);
    }

    /**
     * Get all user preferences (from cache - offline-first)
     * Always returns immediately from cache, no server calls
     */
    getAll(): UserPreferences {
        // Offline-first: Always read from cache
        const prefs = cacheManager.get<UserPreferences>(this.CACHE_KEY, 'localStorage');

        // If no cache exists and not initialized, initialize with empty object
        if (!prefs && !this.isInitialized) {
            cacheManager.set(this.CACHE_KEY, {} as UserPreferences, 'localStorage', this.CACHE_TTL);
            return {};
        }

        return prefs || {};
    }

    /**
     * Get all user preferences from backend (force refresh)
     * This bypasses offline-first strategy and fetches fresh data from server
     */
    async getAllFromBackend(): Promise<UserPreferences> {
        if (!this.isOnline) {
            console.warn('Cannot fetch from backend - offline. Returning cached preferences.');
            return this.getAll();
        }

        try {
            const response = await apiGetPreferences();
            if (response?.preferences) {
                const serverPrefs = response.preferences as UserPreferences;

                // Merge with local changes if any
                const localPrefs = this.getAll();
                if (this.isDirty && Object.keys(localPrefs).length > 0) {
                    // Local changes take precedence
                    const merged = this.deepMerge(serverPrefs, localPrefs);
                    cacheManager.set(this.CACHE_KEY, merged, 'localStorage', this.CACHE_TTL);
                    this.isDirty = true;
                    // Sync merged data back to server
                    this.scheduleSync();
                    return merged;
                } else {
                    // No local changes, use server data
                    cacheManager.set(this.CACHE_KEY, serverPrefs, 'localStorage', this.CACHE_TTL);
                    this.isDirty = false;
                    this.pendingChanges.clear();
                    this.saveSyncMetadata();
                    return serverPrefs;
                }
            }
            return this.getAll();
        } catch (error) {
            console.error('Failed to fetch preferences from backend:', error);
            // Return cached preferences as fallback (offline-first)
            return this.getAll();
        }
    }

    /**
     * Schedule a debounced sync to backend
     * This batches multiple rapid changes into a single API call
     */
    private scheduleSync(): void {
        // Clear existing timeout
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }

        // If too many changes accumulated, sync immediately
        if (this.pendingChanges.size >= this.MAX_BATCH_SIZE) {
            this.syncNow();
            return;
        }

        // Schedule debounced sync
        this.syncTimeout = setTimeout(() => {
            this.syncNow();
        }, this.SYNC_DEBOUNCE_MS);
    }

    /**
     * Sync preferences to backend immediately
     * Offline-First: Only syncs when online, queues changes when offline
     * @param isUrgent - If true, use sendBeacon for page unload scenarios
     */
    private async syncNow(isUrgent = false): Promise<void> {
        // Clear any pending timeout
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = null;
        }

        // If nothing changed, skip sync
        if (!this.isDirty || this.pendingChanges.size === 0) {
            return;
        }

        // Offline-First: If offline, just queue the changes (they're already in cache)
        if (!this.isOnline) {
            // Changes are already in cache, will sync when back online
            return;
        }

        // If already syncing, queue this sync
        if (this.syncInProgress) {
            // Wait a bit and try again
            setTimeout(() => this.syncNow(isUrgent), 100);
            return;
        }

        this.syncInProgress = true;

        try {
            // Get current preferences state from cache (offline-first)
            const currentPreferences = this.getAll();

            // For urgent syncs (page unload), attempt sync with regular API
            // Note: sendBeacon has limitations with auth headers, so we use regular API
            await this.performSync(currentPreferences);

            // Sync successful - clear dirty flag
            this.isDirty = false;
            this.pendingChanges.clear();
            this.saveSyncMetadata();
        } catch (error) {
            console.error('Failed to sync preferences to backend:', error);
            // Keep isDirty true so we retry later
            // Check if error is due to being offline
            if (error instanceof TypeError && error.message.includes('fetch')) {
                this.isOnline = false;
            }
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Perform the actual API sync
     */
    private async performSync(preferences: UserPreferences): Promise<void> {
        // Use updatePreferences to batch all changes into a single API call
        await apiUpdatePreferences(preferences as Record<string, unknown>);
    }


    /**
     * Mark preferences as dirty and schedule sync
     */
    private markDirty(path: string[]): void {
        this.isDirty = true;
        const pathKey = path.join('.');
        this.pendingChanges.add(pathKey);
        this.scheduleSync();
    }

    /**
     * Get a specific preference value by path
     * Example: get('ui.dataListView.roles') or get('ui', 'dataListView', 'roles')
     */
    get<T = unknown>(...path: string[]): T | undefined {
        const preferences = this.getAll();
        let current: unknown = preferences;

        for (const key of path) {
            if (current && typeof current === 'object' && key in current) {
                current = (current as Record<string, unknown>)[key];
            } else {
                return undefined;
            }
        }

        return current as T;
    }

    /**
     * Set a preference value by path - Offline-First
     * Example: set('ui.dataListView.roles', 'list') or set(['ui', 'dataListView', 'roles'], 'list')
     * 
     * Offline-First Strategy:
     * - Updates cache immediately (works offline)
     * - Queues changes for sync when online
     * - Debounces/batches multiple rapid changes
     */
    set<T = unknown>(path: string | string[], value: T): void {
        const pathArray = Array.isArray(path) ? path : path.split('.');
        const preferences = this.getAll();

        // Navigate/create the nested structure
        let current: Record<string, unknown> = preferences;
        for (let i = 0; i < pathArray.length - 1; i++) {
            const key = pathArray[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key] as Record<string, unknown>;
        }

        // Set the value
        const finalKey = pathArray[pathArray.length - 1];
        current[finalKey] = value;

        // Offline-First: Save to cache immediately (works offline)
        cacheManager.set(this.CACHE_KEY, preferences, 'localStorage', this.CACHE_TTL);

        // Mark as dirty and schedule debounced sync (only syncs when online)
        this.markDirty(pathArray);
    }

    /**
     * Set a preference value and await backend sync
     * This forces immediate sync (bypasses debouncing) for critical operations
     */
    async setAsync<T = unknown>(path: string | string[], value: T): Promise<void> {
        const pathArray = Array.isArray(path) ? path : path.split('.');
        const preferences = this.getAll();

        // Navigate/create the nested structure
        let current: Record<string, unknown> = preferences;
        for (let i = 0; i < pathArray.length - 1; i++) {
            const key = pathArray[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key] as Record<string, unknown>;
        }

        // Set the value
        const finalKey = pathArray[pathArray.length - 1];
        current[finalKey] = value;

        // Save to cache immediately
        cacheManager.set(this.CACHE_KEY, preferences, 'localStorage', this.CACHE_TTL);

        // Mark as dirty and force immediate sync (bypass debouncing)
        this.markDirty(pathArray);
        await this.syncNow();
    }

    /**
     * Remove a preference by path
     * Syncs to backend with debouncing/batching
     */
    remove(...path: string[]): void {
        if (path.length === 0) {
            return;
        }

        const preferences = this.getAll();
        let current: Record<string, unknown> = preferences;

        // Navigate to the parent of the target
        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            if (!current[key] || typeof current[key] !== 'object') {
                return; // Path doesn't exist
            }
            current = current[key] as Record<string, unknown>;
        }

        // Remove the final key
        const finalKey = path[path.length - 1];
        delete current[finalKey];

        // Save to cache
        cacheManager.set(this.CACHE_KEY, preferences, 'localStorage', this.CACHE_TTL);

        // Mark as dirty and schedule debounced sync
        this.markDirty(path);
    }

    /**
     * Remove a preference and await backend sync
     * This forces immediate sync (bypasses debouncing) for critical operations
     */
    async removeAsync(...path: string[]): Promise<void> {
        if (path.length === 0) {
            return;
        }

        // Update local state first
        this.remove(...path);

        // Force immediate sync (bypass debouncing)
        await this.syncNow();
    }

    /**
     * Clear all preferences
     * Syncs to backend with debouncing
     */
    clear(): void {
        cacheManager.remove(this.CACHE_KEY, 'localStorage');
        this.isDirty = true;
        this.pendingChanges.clear();
        this.pendingChanges.add('*'); // Mark all as changed
        this.scheduleSync();
    }

    /**
     * Clear all preferences and await backend sync
     */
    async clearAsync(): Promise<void> {
        cacheManager.remove(this.CACHE_KEY, 'localStorage');
        this.isDirty = true;
        this.pendingChanges.clear();
        this.pendingChanges.add('*');
        await this.syncNow();
    }

    /**
     * Update preferences (merge with existing)
     * Syncs to backend with debouncing/batching
     */
    update(updates: Partial<UserPreferences>): void {
        const preferences = this.getAll();
        const merged = this.deepMerge(preferences, updates);
        cacheManager.set(this.CACHE_KEY, merged, 'localStorage', this.CACHE_TTL);

        // Mark all updated keys as dirty (we don't track specific paths in update)
        this.isDirty = true;
        // Mark with wildcard to indicate bulk update
        this.pendingChanges.add('*');
        this.scheduleSync();
    }

    /**
     * Update preferences and await backend sync
     * This forces immediate sync (bypasses debouncing) for critical operations
     */
    async updateAsync(updates: Partial<UserPreferences>): Promise<void> {
        const preferences = this.getAll();
        const merged = this.deepMerge(preferences, updates);
        cacheManager.set(this.CACHE_KEY, merged, 'localStorage', this.CACHE_TTL);

        this.isDirty = true;
        this.pendingChanges.add('*');

        // Force immediate sync
        await this.syncNow();
    }

    /**
     * Deep merge utility
     */
    private deepMerge<T extends Record<string, unknown>>(
        target: T,
        source: Partial<T>
    ): T {
        const output = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = this.deepMerge(
                    (target[key] as Record<string, unknown>) || {},
                    source[key] as Record<string, unknown>
                ) as T[Extract<keyof T, string>];
            } else {
                output[key] = source[key] as T[Extract<keyof T, string>];
            }
        }

        return output;
    }

    /**
     * Get data list view preference for a specific component
     */
    getDataListView(componentId: string): 'card' | 'list' | undefined {
        return this.get<'card' | 'list'>('ui', 'dataListView', componentId);
    }

    /**
     * Set data list view preference for a specific component
     * Syncs to backend asynchronously
     */
    setDataListView(componentId: string, viewMode: 'card' | 'list'): void {
        this.set(['ui', 'dataListView', componentId], viewMode);
    }

    /**
     * Set data list view preference and await backend sync
     */
    async setDataListViewAsync(componentId: string, viewMode: 'card' | 'list'): Promise<void> {
        await this.setAsync(['ui', 'dataListView', componentId], viewMode);
    }

    /**
     * Get store location view preference
     */
    getStoreLocationView(): 'tree' | 'table' | undefined {
        return this.get<'tree' | 'table'>('ui', 'storeLocationView');
    }

    /**
     * Set store location view preference
     * Syncs to backend asynchronously
     */
    setStoreLocationView(viewMode: 'tree' | 'table'): void {
        this.set(['ui', 'storeLocationView'], viewMode);
    }

    /**
     * Set store location view preference and await backend sync
     */
    async setStoreLocationViewAsync(viewMode: 'tree' | 'table'): Promise<void> {
        await this.setAsync(['ui', 'storeLocationView'], viewMode);
    }

    /**
     * Manually flush pending changes to backend
     * Useful for explicit save operations or before navigation
     * Works offline: queues changes if offline, syncs immediately if online
     */
    async flush(): Promise<void> {
        if (this.isOnline) {
            await this.syncNow();
        } else {
        }
    }

    /**
     * Check if currently online
     */
    isCurrentlyOnline(): boolean {
        return this.isOnline;
    }

    /**
     * Clear cache and reset state
     * Useful for logout or cache clearing scenarios
     */
    clearCache(): void {
        cacheManager.remove(this.CACHE_KEY, 'localStorage');
        cacheManager.remove(this.SYNC_METADATA_KEY, 'localStorage');
        this.isDirty = false;
        this.pendingChanges.clear();
        this.isInitialized = false;
        this.cancelPendingSync();
    }

    /**
     * Check if there are unsaved changes
     */
    hasPendingChanges(): boolean {
        return this.isDirty && this.pendingChanges.size > 0;
    }

    /**
     * Get count of pending changes
     */
    getPendingChangesCount(): number {
        return this.pendingChanges.size;
    }

    /**
     * Cancel pending sync (clears debounce timer)
     * Useful when you want to prevent sync in certain scenarios
     */
    cancelPendingSync(): void {
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = null;
        }
    }
}

// Export singleton instance
export const userPreferences = new UserPreferencesManager();

// Export types and utilities
export { UserPreferencesManager };

