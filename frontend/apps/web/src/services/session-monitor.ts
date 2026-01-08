/**
 * Proactive Session Monitoring Service
 * 
 * This service monitors session expiration proactively and handles:
 * 1. Token expiration tracking and warnings
 * 2. Activity-based keepalive requests
 * 3. Tab visibility detection
 * 4. Automatic token refresh before expiration
 * 
 * Key Behaviors:
 * - Token refresh happens in background without interrupting users
 * - Popup warnings only shown when user has been idle for 30+ minutes
 * - Active users never see popup warnings unless token refresh fails
 */

import { storage } from '@truths/utils';
import { STORAGE_KEYS } from '@truths/config';
import { getTimeUntilExpiration, isTokenExpired, getTokenExpiration } from '@truths/utils/jwt';
import { authService } from './auth-service';
import { api } from '@truths/api';

interface SessionConfig {
    idle_timeout_minutes: number;
    device_type: string;
}

interface CachedSessionConfig {
    config: SessionConfig;
    timestamp: number; // Unix timestamp in milliseconds
}

// Cache TTL: 1 hour (config rarely changes, but we want to refresh periodically)
const SESSION_CONFIG_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface SessionMonitorConfig {
    /** Warning threshold in seconds before expiration (default: 300 = 5 minutes) */
    warningThresholdSeconds?: number;
    /** Keepalive interval in seconds for active users (default: 600 = 10 minutes) */
    keepaliveIntervalSeconds?: number;
    /** Minimum activity time before sending keepalive (default: 30 seconds) */
    minActivityBeforeKeepaliveSeconds?: number;
    /** Check interval for expiration monitoring (default: 30 seconds) */
    checkIntervalSeconds?: number;
    /** Enable activity-based keepalive (default: true) */
    enableKeepalive?: boolean;
    /** Enable visibility-based checking (default: true) */
    enableVisibilityCheck?: boolean;
    /** Idle timeout in minutes before showing popup (default: 30) */
    idleTimeoutMinutes?: number;
}

export interface SessionMonitorCallbacks {
    /** Called when session is about to expire (within warning threshold) */
    onWarning?: (timeUntilExpiration: number) => void;
    /** Called when session has expired */
    onExpired?: () => void;
    /** Called when session is refreshed successfully */
    onRefreshed?: () => void;
}

export class SessionMonitor {
    private config: Required<SessionMonitorConfig>;
    private callbacks: SessionMonitorCallbacks;

    // Interval timers
    private expirationCheckInterval: NodeJS.Timeout | null = null;
    private keepaliveInterval: NodeJS.Timeout | null = null;

    // Activity tracking
    private lastActivityTime: number = Date.now();
    private activityListeners: (() => void)[] = [];

    // Visibility tracking
    private isTabVisible: boolean = true;
    private visibilityListener: (() => void) | null = null;

    // Refresh state
    private isRefreshing: boolean = false;
    private lastWarningTime: number = 0;

    // Idle tracking for session timeout
    private lastUserActivityTime: number = Date.now();

    // Session configuration from server (with caching)
    private sessionConfig: SessionConfig | null = null;
    private sessionConfigCacheTimestamp: number = 0;

    constructor(
        config: SessionMonitorConfig = {},
        callbacks: SessionMonitorCallbacks = {}
    ) {
        this.config = {
            warningThresholdSeconds: config.warningThresholdSeconds ?? 300, // 5 minutes
            keepaliveIntervalSeconds: config.keepaliveIntervalSeconds ?? 600, // 10 minutes
            minActivityBeforeKeepaliveSeconds: config.minActivityBeforeKeepaliveSeconds ?? 30, // 30 seconds
            checkIntervalSeconds: config.checkIntervalSeconds ?? 30, // 30 seconds
            enableKeepalive: config.enableKeepalive ?? true,
            enableVisibilityCheck: config.enableVisibilityCheck ?? true,
            idleTimeoutMinutes: config.idleTimeoutMinutes ?? 30, // 30 minutes
        };
        this.callbacks = callbacks;
    }

    /**
     * Start monitoring session
     */
    start(): void {
        this.stop(); // Ensure clean start

        // Fetch session configuration from server
        this.fetchSessionConfig();

        // Start expiration checking
        this.startExpirationMonitoring();

        // Start activity-based keepalive
        if (this.config.enableKeepalive) {
            this.startActivityTracking();
            this.startKeepalive();
        }

        // Start visibility detection
        if (this.config.enableVisibilityCheck && typeof document !== 'undefined') {
            this.startVisibilityTracking();
        }
    }

    /**
     * Load session configuration from cache (localStorage)
     */
    private loadSessionConfigFromCache(): SessionConfig | null {
        try {
            const cached = storage.get<CachedSessionConfig>(STORAGE_KEYS.SESSION_CONFIG);
            if (!cached || !cached.config || !cached.timestamp) {
                return null;
            }

            // Check if cache is still valid
            const now = Date.now();
            const cacheAge = now - cached.timestamp;
            if (cacheAge > SESSION_CONFIG_CACHE_TTL_MS) {
                // Cache expired, remove it
                storage.remove(STORAGE_KEYS.SESSION_CONFIG);
                return null;
            }

            return cached.config;
        } catch (error) {
            // Cache invalid or corrupted, remove it
            storage.remove(STORAGE_KEYS.SESSION_CONFIG);
            return null;
        }
    }

    /**
     * Save session configuration to cache (localStorage)
     */
    private saveSessionConfigToCache(config: SessionConfig): void {
        try {
            const cached: CachedSessionConfig = {
                config,
                timestamp: Date.now(),
            };
            storage.set(STORAGE_KEYS.SESSION_CONFIG, cached);
        } catch (error) {
            // Fail silently - caching is not critical
            console.debug('Failed to cache session config:', error);
        }
    }

    /**
     * Clear cached session configuration
     */
    clearSessionConfigCache(): void {
        this.sessionConfig = null;
        this.sessionConfigCacheTimestamp = 0;
        storage.remove(STORAGE_KEYS.SESSION_CONFIG);
    }

    /**
     * Fetch session configuration from server with caching
     */
    private async fetchSessionConfig(): Promise<void> {
        // Check in-memory cache first (fastest)
        const now = Date.now();
        const cacheAge = now - this.sessionConfigCacheTimestamp;
        if (this.sessionConfig && cacheAge < SESSION_CONFIG_CACHE_TTL_MS) {
            // Use cached config - don't make any requests
            return;
        }

        // Check localStorage cache before making request
        const cachedConfig = this.loadSessionConfigFromCache();
        if (cachedConfig) {
            this.sessionConfig = cachedConfig;
            this.sessionConfigCacheTimestamp = now;
            // Cache is valid, don't fetch from server
            return;
        }

        // Only fetch if we have an auth token AND cache is expired/missing
        const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
        if (!token) {
            // No token, use default configuration
            return;
        }

        // Fetch from server (only if cache is expired and we have a token)
        try {
            const config = await api.get<SessionConfig>('/api/v1/sessions/config', { requiresAuth: true });

            // Update cache
            this.sessionConfig = config;
            this.sessionConfigCacheTimestamp = now;
            this.saveSessionConfigToCache(config);
        } catch (error: any) {
            // Silently fail - use default configuration
            // Suppress 404 and 401 errors (endpoint may not exist or user not authenticated)
            const errorStatus = error?.status;
            if (errorStatus === 404 || errorStatus === 401) {
                // These are expected errors - endpoint may not exist or user needs to authenticate
                // Don't log, don't retry - just use default config
                return;
            }

            // For other errors, log a warning (but only in development)
            if (process.env.NODE_ENV === 'development' && errorStatus && errorStatus !== 404 && errorStatus !== 401) {
                console.debug('Failed to fetch session configuration:', error);
            }

            // Try to use cached config as fallback (even if expired)
            const fallbackConfig = this.loadSessionConfigFromCache();
            if (fallbackConfig) {
                this.sessionConfig = fallbackConfig;
                this.sessionConfigCacheTimestamp = now;
            }
            // Otherwise, use default configuration
        }
    }

    /**
     * Stop monitoring session
     */
    stop(): void {
        if (this.expirationCheckInterval) {
            clearInterval(this.expirationCheckInterval);
            this.expirationCheckInterval = null;
        }

        if (this.keepaliveInterval) {
            clearInterval(this.keepaliveInterval);
            this.keepaliveInterval = null;
        }

        this.stopActivityTracking();
        this.stopVisibilityTracking();
    }

    /**
     * Manually refresh the session
     */
    async refreshSession(): Promise<boolean> {
        if (this.isRefreshing) {
            return false; // Already refreshing
        }

        // Check if refresh token exists before attempting refresh
        const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
            console.warn('No refresh token available, cannot refresh session');
            return false;
        }

        try {
            this.isRefreshing = true;
            await authService.refreshToken();
            this.lastWarningTime = 0; // Reset warning

            if (this.callbacks.onRefreshed) {
                this.callbacks.onRefreshed();
            }

            return true;
        } catch (error) {
            console.error('Failed to refresh session:', error);
            return false;
        } finally {
            this.isRefreshing = false;
        }
    }

    /**
     * Update activity timestamp (call this on user interaction)
     */
    recordActivity(): void {
        this.lastActivityTime = Date.now();
        this.lastUserActivityTime = Date.now();
    }

    /**
     * Get current token expiration info
     */
    getExpirationInfo(): { expiration: Date | null; timeUntilExpiration: number | null; isExpired: boolean } {
        const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
        if (!token) {
            return { expiration: null, timeUntilExpiration: null, isExpired: true };
        }

        const expiration = getTokenExpiration(token);
        const timeUntilExpiration = getTimeUntilExpiration(token);
        const isExpired = isTokenExpired(token);

        return { expiration, timeUntilExpiration, isExpired };
    }

    private startExpirationMonitoring(): void {
        // Check immediately
        this.checkExpiration();

        // Then check at intervals
        this.expirationCheckInterval = setInterval(() => {
            this.checkExpiration();
        }, this.config.checkIntervalSeconds * 1000);
    }

    private checkExpiration(): void {
        const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
        if (!token) {
            return; // No token, nothing to check
        }

        // Check if refresh token exists - if not, we can't refresh, so show expired dialog immediately
        const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
        const hasRefreshToken = !!refreshToken;

        // Check if already expired
        if (isTokenExpired(token)) {
            // If no refresh token available, show expired dialog immediately
            if (!hasRefreshToken) {
                if (this.callbacks.onExpired) {
                    this.callbacks.onExpired();
                }
                return;
            }

            // Try to refresh first before showing expired dialog
            // This handles the case where refresh token is still valid
            if (!this.isRefreshing) {
                this.refreshSession()
                    .then((success) => {
                        if (!success) {
                            // Refresh failed, show expired dialog
                            if (this.callbacks.onExpired) {
                                this.callbacks.onExpired();
                            }
                        }
                        // If refresh succeeded, onRefreshed callback will handle cleanup
                    })
                    .catch(() => {
                        // Refresh failed, show expired dialog
                        if (this.callbacks.onExpired) {
                            this.callbacks.onExpired();
                        }
                    });
            } else {
                // Already refreshing, wait for it to complete
                // If it fails, the refreshSession error handling will show the dialog
            }
            return;
        }

        // Check if approaching expiration (warning threshold)
        const timeUntilExpiration = getTimeUntilExpiration(token);
        if (timeUntilExpiration !== null) {
            const warningThresholdMs = this.config.warningThresholdSeconds * 1000;

            // Get idle timeout from server config if available, otherwise use default
            const idleTimeoutMinutes = this.sessionConfig?.idle_timeout_minutes ?? this.config.idleTimeoutMinutes;
            const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;
            const timeSinceActivity = Date.now() - this.lastUserActivityTime;
            const isUserIdle = timeSinceActivity > idleTimeoutMs;

            // Only show warning if user is idle, otherwise refresh in background
            if (
                hasRefreshToken &&
                timeUntilExpiration <= warningThresholdMs &&
                timeUntilExpiration > 0 &&
                isUserIdle &&
                Date.now() - this.lastWarningTime > 60000 // Don't warn more than once per minute
            ) {
                this.lastWarningTime = Date.now();
                if (this.callbacks.onWarning) {
                    this.callbacks.onWarning(timeUntilExpiration);
                }
            }

            // Auto-refresh in background if token is expiring soon
            // This keeps the session alive for active users without interrupting them
            const autoRefreshThresholdMs = 5 * 60 * 1000; // 5 minutes - refresh earlier
            if (
                hasRefreshToken &&
                timeUntilExpiration <= autoRefreshThresholdMs &&
                timeUntilExpiration > 0 &&
                !this.isRefreshing &&
                !isUserIdle
            ) {
                // Refresh proactively in background
                this.refreshSession().catch((error) => {
                    console.error('Auto-refresh failed:', error);
                });
            }
        }
    }

    private startActivityTracking(): void {
        if (typeof window === 'undefined') return;

        // Track various user activities
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        const handleActivity = () => {
            this.recordActivity();
        };

        // Throttle activity tracking (don't record every tiny movement)
        let lastRecorded = 0;
        const throttledHandleActivity = () => {
            const now = Date.now();
            if (now - lastRecorded > 5000) { // Record at most once per 5 seconds
                lastRecorded = now;
                handleActivity();
            }
        };

        events.forEach((event) => {
            window.addEventListener(event, throttledHandleActivity, { passive: true });
            this.activityListeners.push(() => {
                window.removeEventListener(event, throttledHandleActivity);
            });
        });
    }

    private stopActivityTracking(): void {
        this.activityListeners.forEach((cleanup) => cleanup());
        this.activityListeners = [];
    }

    private startKeepalive(): void {
        // Send keepalive at intervals
        this.keepaliveInterval = setInterval(() => {
            this.sendKeepalive();
        }, this.config.keepaliveIntervalSeconds * 1000);
    }

    private async sendKeepalive(): Promise<void> {
        // Only send keepalive if:
        // 1. Tab is visible
        // 2. User has been active recently
        // 3. Not already refreshing
        // 4. Token exists
        const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
        if (!token || this.isRefreshing) {
            return;
        }

        const timeSinceActivity = Date.now() - this.lastActivityTime;
        const minActivityMs = this.config.minActivityBeforeKeepaliveSeconds * 1000;

        if (!this.isTabVisible || timeSinceActivity > minActivityMs) {
            return; // User inactive or tab hidden
        }

        // Send a lightweight request to update session activity
        // Using /auth/me as it's lightweight and requires auth
        try {
            await api.get('/api/v1/auth/me', { requiresAuth: true });
        } catch (error) {
            // If keepalive fails, it might mean session expired
            // The expiration checker will handle showing the dialog
            console.debug('Keepalive request failed (this is ok if session expired):', error);
        }
    }

    private startVisibilityTracking(): void {
        if (typeof document === 'undefined') return;

        const handleVisibilityChange = () => {
            const wasVisible = this.isTabVisible;
            this.isTabVisible = !document.hidden;

            // When tab becomes visible, check session immediately
            if (!wasVisible && this.isTabVisible) {
                // Small delay to ensure token is loaded and state is ready
                setTimeout(() => {
                    // Check expiration first (handles expired tokens and refresh in background)
                    this.checkExpiration();
                }, 100);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        this.visibilityListener = () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }

    private stopVisibilityTracking(): void {
        if (this.visibilityListener) {
            this.visibilityListener();
            this.visibilityListener = null;
        }
    }
}

// Export singleton instance factory
let monitorInstance: SessionMonitor | null = null;

export function createSessionMonitor(
    config?: SessionMonitorConfig,
    callbacks?: SessionMonitorCallbacks
): SessionMonitor {
    if (monitorInstance) {
        monitorInstance.stop();
    }

    monitorInstance = new SessionMonitor(config, callbacks);
    return monitorInstance;
}

export function getSessionMonitor(): SessionMonitor | null {
    return monitorInstance;
}

