import { api, registerAuthService, setLoginGracePeriod, setLoggingOut } from '@truths/api'
import { storage, userPreferences } from '@truths/utils'
import { API_CONFIG, STORAGE_KEYS } from '@truths/config'

export interface LoginCredentials {
    username: string
    password: string
}

export interface TokenResponse {
    access_token: string
    refresh_token: string
    id_token: string
    token_type: string
    expires_in: number
    must_change_password?: boolean
}

export interface User {
    // Support both backend response formats
    id?: string
    sub?: string
    username: string
    email: string
    // Legacy format (combined name)
    name?: string
    // Backend format (separate first/last name)
    first_name?: string
    last_name?: string
    role: string
    tenant_id?: string
    must_change_password?: boolean
}

export interface ChangePasswordCredentials {
    current_password: string
    new_password: string
}

export class AuthenticationError extends Error {
    constructor(
        message: string,
        public type: 'locked' | 'inactive' | 'invalid_credentials' | 'unknown',
        public lockedUntil?: string
    ) {
        super(message)
        this.name = 'AuthenticationError'
    }
}

export const authService = {
    /**
     * Login with username/email and password
     * Backend accepts OAuth2PasswordRequestForm format
     */
    async login(credentials: LoginCredentials): Promise<TokenResponse> {
        // OAuth2 requires form data format
        const formData = new URLSearchParams()
        formData.append('username', credentials.username)
        formData.append('password', credentials.password)

        // Construct full URL using config
        // BASE_URL is likely http://localhost:8000
        // ENDPOINTS.AUTH.LOGIN is /api/v1/auth/token
        // We need to be careful about double slashes if BASE_URL has a trailing slash
        const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, '')
        const endpoint = API_CONFIG.ENDPOINTS.AUTH.LOGIN
        const url = `${baseUrl}${endpoint}`

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        })

        if (!response.ok) {
            let errorMessage = 'Login failed'
            let errorType: 'locked' | 'inactive' | 'invalid_credentials' | 'unknown' = 'unknown'
            let lockedUntil: string | undefined

            // Get response text first (can be JSON or plain text)
            const responseText = await response.text()

            try {
                // Try to parse as JSON first (FastAPI error response)
                // FastAPI HTTPException uses "detail", but custom handlers may use "message"
                const errorData = JSON.parse(responseText)
                errorMessage = errorData.detail || errorData.message || errorMessage
            } catch {
                // If JSON parsing fails, use as plain text
                errorMessage = responseText || errorMessage
            }

            // Check if account is locked
            if (errorMessage.includes('locked until')) {
                errorType = 'locked'
                // Extract the timestamp from the error message
                const match = errorMessage.match(/locked until (.+)/i)
                if (match) {
                    lockedUntil = match[1].trim()
                }
            }
            // Check if account is inactive
            else if (errorMessage.toLowerCase().includes('account is inactive') || errorMessage.toLowerCase().includes('inactive')) {
                errorType = 'inactive'
            }
            // Default to invalid credentials
            else {
                errorType = 'invalid_credentials'
            }

            throw new AuthenticationError(errorMessage, errorType, lockedUntil)
        }

        const data = await response.json()

        // CRITICAL SECURITY: Clear all previous user's cached data before storing new tokens
        // This prevents data leakage between different user sessions
        // Safely clear persisted React Query cache (contains all API response data)
        if (storage && typeof storage.remove === 'function') {
            storage.remove('REACT_QUERY_OFFLINE_CACHE')
            // Clear tabs cache (may contain user-specific navigation state)
            storage.remove('app_tabs')
            // Clear scroll positions (may be user-specific)
            storage.remove('scroll_positions')
        }

        // Store tokens (with safety check)
        if (storage && typeof storage.set === 'function') {
            storage.set(STORAGE_KEYS.AUTH_TOKEN, data.access_token)
            storage.set(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token)

            // Store username/email for quick re-login when session expires
            // This allows auto-filling username in session expired dialog
            storage.set('last_username', credentials.username)
        } else {
            console.error('Storage utility is not available - cannot store authentication tokens')
            throw new Error('Storage utility is not available')
        }

        // Clear logout flag since user is now logging in
        setLoggingOut(false)

        // Set grace period to prevent session expired dialog from appearing
        // immediately after login (allows authentication state to settle)
        setLoginGracePeriod()

        // Initialize user preferences from backend (fire and forget)
        // This ensures preferences are available immediately after login
        userPreferences.initialize().catch(error => {
            console.warn('Failed to initialize user preferences:', error);
        });

        return data
    },

    /**
     * Logout - invalidate tokens on server and clear local storage
     * 
     * Note: React Query cache should be cleared separately using queryClient.clear()
     * in components that call this method, to prevent showing previous user's cached data.
     */
    async logout(): Promise<void> {
        const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN)

        // Clear tokens from local storage immediately
        storage.remove(STORAGE_KEYS.AUTH_TOKEN)
        storage.remove(STORAGE_KEYS.REFRESH_TOKEN)

        // Clear must_change_password flag
        storage.remove('must_change_password')

        // Clear cached session configuration using centralized cache manager
        const { cacheManager, CACHE_KEYS } = await import('@truths/utils')
        cacheManager.remove(CACHE_KEYS.SESSION_CONFIG)

        // Also clear session monitor cache if it's running
        try {
            const { getSessionMonitor } = await import('./session-monitor')
            const monitor = getSessionMonitor()
            if (monitor) {
                monitor.clearSessionConfigCache()
            }
        } catch {
            // Session monitor might not be available, ignore
        }

        // Trigger cache invalidation for logout
        cacheManager.handleInvalidation({
            type: 'invalidate',
            cachePattern: 'auth:*',
        })

        // Attempt to invalidate tokens on the server
        // This will also invalidate user cache on the backend
        // Don't throw error if this fails (tokens already cleared locally)
        if (refreshToken) {
            try {
                await api.post('/api/v1/auth/logout', {
                    refresh_token: refreshToken
                }, { requiresAuth: false })
            } catch (error) {
                // Log but don't throw - user is already logged out locally
                console.warn('Server-side logout failed:', error)
            }
        }
    },

    /**
     * Logout synchronously (for emergency cleanup)
     * Use async logout() when possible
     */
    logoutSync(): void {
        storage.remove(STORAGE_KEYS.AUTH_TOKEN)
        storage.remove(STORAGE_KEYS.REFRESH_TOKEN)
        storage.remove('must_change_password')

        // Use centralized cache manager (synchronous import)
        // Note: Dynamic import would be async, so we'll handle cache clearing
        // via the async logout method when possible
        try {
            // Try to clear session config cache if cache manager is available
            const sessionConfigKey = 'session:config';
            storage.remove(`cache:${sessionConfigKey}`);
        } catch {
            // Ignore - cache clearing is non-critical for sync logout
        }

        // Note: Session monitor cache will be cleared when it next checks for auth token
        // For synchronous cleanup, localStorage removal is sufficient
    },

    /**
     * Get current user info
     */
    async getCurrentUser(): Promise<User> {
        return api.get<User>('/api/v1/auth/me', { requiresAuth: true })
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!storage.get(STORAGE_KEYS.AUTH_TOKEN)
    },

    /**
     * Get access token
     */
    getAccessToken(): string | null {
        return storage.get<string>(STORAGE_KEYS.AUTH_TOKEN)
    },

    /**
     * Refresh access token
     */
    async refreshToken(): Promise<TokenResponse> {
        const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN)

        if (!refreshToken) {
            throw new Error('No refresh token available')
        }

        // Refresh endpoint should NOT require auth (use refresh token instead)
        const data = await api.post<TokenResponse>('/api/v1/auth/refresh', {
            refresh_token: refreshToken,
        }, { requiresAuth: false })

        // Update stored tokens
        storage.set(STORAGE_KEYS.AUTH_TOKEN, data.access_token)
        storage.set(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token)

        return data
    },

    /**
     * Change user password
     */
    async changePassword(credentials: ChangePasswordCredentials): Promise<void> {
        await api.post('/api/v1/auth/change-password', credentials, { requiresAuth: true })
    },

    /**
     * Check if user must change password (stored in token or user state)
     */
    getMustChangePassword(): boolean {
        // Check if stored in localStorage
        return storage.get<boolean>('must_change_password') ?? false
    },

    /**
     * Set must_change_password flag
     */
    setMustChangePassword(value: boolean): void {
        storage.set('must_change_password', value)
    },

    /**
     * Clear must_change_password flag
     */
    clearMustChangePassword(): void {
        storage.remove('must_change_password')
    },
}

// Register auth service functions with the API client for token refresh
registerAuthService(authService.refreshToken, authService.logoutSync)

