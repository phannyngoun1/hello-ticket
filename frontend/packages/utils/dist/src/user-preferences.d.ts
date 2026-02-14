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
/**
 * User preference types
 */
export interface UserPreferences {
    ui?: {
        dataListView?: Record<string, 'card' | 'list'>;
        storeLocationView?: 'tree' | 'table';
        theme?: 'light' | 'dark' | 'system';
        tabPosition?: 'separate' | 'inline';
        enableTabs?: boolean;
        [key: string]: unknown;
    };
    dataDisplay?: {
        pageSize?: number;
        sortOrder?: Record<string, 'asc' | 'desc'>;
        columnVisibility?: Record<string, boolean[]>;
        [key: string]: unknown;
    };
    notifications?: {
        email?: boolean;
        push?: boolean;
        sms?: boolean;
        [key: string]: boolean | unknown;
    };
    cache?: {
        queryCacheEnabled?: boolean;
        reactQueryCacheEnabled?: boolean;
        [key: string]: unknown;
    };
    [category: string]: Record<string, unknown> | undefined;
}
/**
 * Centralized User Preferences Manager - Offline-First Implementation
 */
declare class UserPreferencesManager {
    private readonly CACHE_KEY;
    private readonly CACHE_TTL;
    private readonly SYNC_METADATA_KEY;
    private readonly SYNC_DEBOUNCE_MS;
    private readonly MAX_BATCH_SIZE;
    private syncTimeout;
    private pendingChanges;
    private isDirty;
    private isOnline;
    private isInitialized;
    private syncInProgress;
    constructor();
    /**
     * Handle online event - sync pending changes
     */
    private handleOnline;
    /**
     * Handle offline event
     */
    private handleOffline;
    /**
     * Check if cache exists and is valid
     */
    private hasCache;
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
    initialize(forceReload?: boolean): Promise<void>;
    /**
     * Sync to server if we have pending changes (background sync)
     */
    private syncToServerIfNeeded;
    /**
     * Save sync metadata to track last sync state
     */
    private saveSyncMetadata;
    /**
     * Get all user preferences (from cache - offline-first)
     * Always returns immediately from cache, no server calls
     */
    getAll(): UserPreferences;
    /**
     * Get all user preferences from backend (force refresh)
     * This bypasses offline-first strategy and fetches fresh data from server
     */
    getAllFromBackend(): Promise<UserPreferences>;
    /**
     * Schedule a debounced sync to backend
     * This batches multiple rapid changes into a single API call
     */
    private scheduleSync;
    /**
     * Sync preferences to backend immediately
     * Offline-First: Only syncs when online, queues changes when offline
     * @param isUrgent - If true, use sendBeacon for page unload scenarios
     */
    private syncNow;
    /**
     * Perform the actual API sync
     */
    private performSync;
    /**
     * Mark preferences as dirty and schedule sync
     */
    private markDirty;
    /**
     * Get a specific preference value by path
     * Example: get('ui.dataListView.roles') or get('ui', 'dataListView', 'roles')
     */
    get<T = unknown>(...path: string[]): T | undefined;
    /**
     * Set a preference value by path - Offline-First
     * Example: set('ui.dataListView.roles', 'list') or set(['ui', 'dataListView', 'roles'], 'list')
     *
     * Offline-First Strategy:
     * - Updates cache immediately (works offline)
     * - Queues changes for sync when online
     * - Debounces/batches multiple rapid changes
     */
    set<T = unknown>(path: string | string[], value: T): void;
    /**
     * Set a preference value and await backend sync
     * This forces immediate sync (bypasses debouncing) for critical operations
     */
    setAsync<T = unknown>(path: string | string[], value: T): Promise<void>;
    /**
     * Remove a preference by path
     * Syncs to backend with debouncing/batching
     */
    remove(...path: string[]): void;
    /**
     * Remove a preference and await backend sync
     * This forces immediate sync (bypasses debouncing) for critical operations
     */
    removeAsync(...path: string[]): Promise<void>;
    /**
     * Clear all preferences
     * Syncs to backend with debouncing
     */
    clear(): void;
    /**
     * Clear all preferences and await backend sync
     */
    clearAsync(): Promise<void>;
    /**
     * Update preferences (merge with existing)
     * Syncs to backend with debouncing/batching
     */
    update(updates: Partial<UserPreferences>): void;
    /**
     * Update preferences and await backend sync
     * This forces immediate sync (bypasses debouncing) for critical operations
     */
    updateAsync(updates: Partial<UserPreferences>): Promise<void>;
    /**
     * Deep merge utility
     */
    private deepMerge;
    /**
     * Get data list view preference for a specific component
     */
    getDataListView(componentId: string): 'card' | 'list' | undefined;
    /**
     * Set data list view preference for a specific component
     * Syncs to backend asynchronously
     */
    setDataListView(componentId: string, viewMode: 'card' | 'list'): void;
    /**
     * Set data list view preference and await backend sync
     */
    setDataListViewAsync(componentId: string, viewMode: 'card' | 'list'): Promise<void>;
    /**
     * Get store location view preference
     */
    getStoreLocationView(): 'tree' | 'table' | undefined;
    /**
     * Set store location view preference
     * Syncs to backend asynchronously
     */
    setStoreLocationView(viewMode: 'tree' | 'table'): void;
    /**
     * Set store location view preference and await backend sync
     */
    setStoreLocationViewAsync(viewMode: 'tree' | 'table'): Promise<void>;
    /**
     * Manually flush pending changes to backend
     * Useful for explicit save operations or before navigation
     * Works offline: queues changes if offline, syncs immediately if online
     */
    flush(): Promise<void>;
    /**
     * Check if currently online
     */
    isCurrentlyOnline(): boolean;
    /**
     * Clear cache and reset state
     * Useful for logout or cache clearing scenarios
     */
    clearCache(): void;
    /**
     * Check if there are unsaved changes
     */
    hasPendingChanges(): boolean;
    /**
     * Get count of pending changes
     */
    getPendingChangesCount(): number;
    /**
     * Cancel pending sync (clears debounce timer)
     * Useful when you want to prevent sync in certain scenarios
     */
    cancelPendingSync(): void;
}
export declare const userPreferences: UserPreferencesManager;
export { UserPreferencesManager };
//# sourceMappingURL=user-preferences.d.ts.map